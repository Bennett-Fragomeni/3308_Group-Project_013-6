const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');

const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  };

const db = pgp(dbConfig);

db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
});

app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      saveUninitialized: false,
      resave: false,
    })
);
  
app.use(
    bodyParser.urlencoded({
      extended: true,
    })
);

// BASE API
app.get('/', (req, res) =>{
    console.log('GET: /');
    res.render('pages/login')
});
  
// LOGIN GET API
app.get('/login', (req, res) => {
    console.log('GET: /login');
    res.render('pages/login');
});

// LOGIN POST API
app.post('/login', (req, res) => {
    console.log('POST: /login');
    const query = 'SELECT * FROM users WHERE users.username = $1'; // May need to change for specific database
    db.any(query, [
        req.body.username // User's input
    ])
    .then(async function (data) {
        const match = await bcrypt.compare(req.body.password, data[0].password);
        if (match == false) {
            console.log('Incorrect password');
            return res.render('pages/login', {
              message: 'Incorrect username or password',
              error: true
            });
        }
        else {
            console.log('User found and passwords match')
            req.session.user = {
                username: data.username,
                email: data.email
              };
            req.session.save();
            return res.redirect('/home'); // May change what redirects to
        }
      })
      .catch(err => {
        console.log('Cannot find username');
        res.render('pages/login', {
          message: 'Incorrect username or password',
          error: true
        });
      });
});

/* AUTHENTICATION
const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to register as long as current path is not register
      console.log('AUTHENTICATION redirect /register');
      return res.render('pages/login');
    }
    next();
  };
app.use(auth);*/

// REGISTER GET API
app.get('/register', (req, res) => {
    console.log('GET: /register');
    res.render('pages/register');
});

// REGISTER POST 
app.post('/register', async (req, res) => {
    console.log('POST: /register');

    if (req.body.password != req.body.confirmpassword) {
      console.log('passwords don\'t match')
      console.log(req.body.password);
      console.log(req.body.confirmpassword);
      return res.render('pages/register', {
        error: true,
        message: 'Passwords do not match'
      });
    }

    const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3);'; // May need to change depending on database
    const hash = await bcrypt.hash(req.body.password, 10); // Hashed password
    db.any(query, [
        req.body.username,
        req.body.email,
        hash
    ])
    .then(function (data) {
        console.log(JSON.stringify(data))
        console.log('register successful');
        res.redirect('/login');
      })
      .catch(function (err) {
        res.render('pages/register', {
          error: true,
          message: "Failed to register"
        });
        console.log('Failed to register: ', err);
      });
  });

// GET HOME
app.get('/home', (req, res) => {
  console.log('GET: /home');
  res.render('pages/home');
});

// Get /recipes
app.get('/recipes', (req, res) => {
  const query = 'SELECT * FROM recipes ORDER BY recipes.recipe_id DESC'
  db.any(query, [
    req.body.search
  ])
  .then(recipes => {
    console.log(recipes);
    res.render('pages/recipes', {
      recipes: recipes,
    }); 
  })
  .catch(function (err) {
    res.redirect('/home');
    console.log('Failed to GET: /recipes')
  });

});

app.post('/recipes', (req,res) => {
    console.log(req.body.search);
    const query = 'SELECT * FROM recipes WHERE position(LOWER($1) in LOWER(recipe_name)) > 0 ORDER BY recipes.recipe_id DESC';
    db.any(query, [
        req.body.search
    ])
    .then(recipes => {
        console.log(recipes);
        res.render('pages/recipes', {
            recipes: recipes,
        }); 
    })
    .catch(function (err) {
        res.redirect('/recipes');
        console.log('Failed to POST: /recipes')
    });
});

app.get('/view_recipe', (req, res) => {
  console.log('GET: view_recipe');
  res.render('pages/view_recipe');
});

app.post('/view_recipe', (req, res) => {
  console.log('POST: view_recipe');
  var recipeID = req.body.recipe_id;
  const query1 = 'SELECT * FROM recipes WHERE recipe_id = $1'
  const query2 = 'SELECT quantity, ingredient_name, unit_name FROM (recipe_to_ingredients ri INNER JOIN ingredients i ON ri.ingredient_id = i.ingredient_id) rii INNER JOIN units u ON rii.unit_id = u.unit_id WHERE recipe_id = $1';
  db.any(query1, [
    recipeID
  ])
  .then((data1) => {
    console.log(data1);
    if (!data1)
      return console.log("No recipe found")
    db.any(query2, [
      recipeID
    ])
    .then((data2) => { 
      console.log(data2);
      if (!data2)
        return console.log("No ingredients found")
      res.render('pages/view_recipe', {
        recipe: data1[0],
        ingredients: data2
      })
    })
    .catch((error) => {
      console.log(error);
      res.redirect('/recipes');
    })
  })
  .catch((error) => {
    console.log(error);
    res.redirect('/recipes');
  })
});

app.get('/create_recipe', (req, res) => {
  console.log('GET: create_recipe');
  res.render('pages/create_recipe');
});

app.post('/create_recipe', (req, res) => {
  console.log('POST: create_recipe');
  console.log(req.body.recipe_name);
  const recipe_query = 'INSERT INTO recipes (recipe_name, recipe_desc, recipe_img_url) VALUES ($1,$2,$3)';
  const ingredient_query = 'INSERT INTO ingredients(ingredient_name) VALUES ($1); INSERT INTO ingredients(ingredient_name) VALUES ($2); INSERT INTO ingredients(ingredient_name) VALUES ($3);';
  const ingredient_to_recipe_query = 'INSERT INTO recipe_to_ingredients (recipe_id, ingredient_id) VALUES (SELECT recipe_id FROM recipes WHERE recipe_name = $1, SELECT ingredient_id FROM ingredients WHERE ingredient_name = $2); INSERT INTO recipe_to_ingredients (recipe_id, ingredient_id) VALUES (SELECT recipe_id FROM recipes WHERE recipe_name = $1, SELECT ingredient_id FROM ingredients WHERE ingredient_name = $3); INSERT INTO recipe_to_ingredients (recipe_id, ingredient_id) VALUES (SELECT recipe_id FROM recipes WHERE recipe_name = $1, SELECT ingredient_id FROM ingredients WHERE ingredient_name = $4); ';

  db.any(recipe_query, [
    req.body.recipe_name,
    req.body.recipe_desc,
    req.body.recipe_img_url
  ])
  .then(function (data) {
    console.log('Recipe added');
    // Adds recipe to database

    db.any(ingredient_query, [
      req.body.ingredient_1,
      req.body.ingredient_2,
      req.body.ingredient_3
    ])
    .then(function (data2) {
      console.log('Ingredients added');
      // Adds ingredients to database

      db.any(ingredient_to_recipe_query, [
        req.body.recipe_name,
        req.body.ingredient_1,
        req.body.ingredient_2,
        req.body.ingredient_3,
      ])
      .then(function (data3) {
        console.log('recipe_to_ingredients updated');
        // Updates recipe_to_ingredients table
      })
      .catch(function(err) {
        console.log('Failed to update recipe_to_ingredients');
      });


    })
    .catch(function (err) {
      res.redirect('/create_recipe');
      console.log('Failed to add ingredients');
    });
    // Adds ingredients to database

    res.redirect('/');
  })
  .catch(function (err) {
    res.redirect('/create_recipe');
    console.log('Failed to add recipe');
  });
});

// POST HOME
app.post('/home', (req, res) => {
  // Recipe Search
  if (req.action = "recipe"){ //will probably need to change
    console.log('Recipe Search')
    const query = 'SELECT * FROM recipes WHERE recipes.recipe_name = $1;';
    db.any(query, [
      req.name
    ])
    .then(function (data) {
        res.render('/home', 
          res.recipe = data,
          res.message = "Sucessfully got recipe"
        );
      })
      .catch(function (err) {
        res.render('pages/home', 
          res.message = "Unknown recipe"
        );
        console.log('Failed to search recipe');
      });
  }
  if(req.action = "ingredients"){
    console.log("GET: Ingredients")
    const query = `SELECT * FROM recipes,
    JOIN recipe_to_ingredients, 
      ON recipes.recipe_id = recipe_to_ingredients.recipe_id, 
    JOIN ingredients,
      ON recipe_to_ingredients.ingredient_id = ingredients.ingredient_id,
    WHERE recipes.recipe_name = $1;`;
    db.any(query, [
      req.name
    ])
    .then(function (data) {
        res.render('pages/home', 
          ingredients = data,
          message = "Sucessfully got Ingredients"
        );
      })
      .catch(function (err) {
        res.render('pages/home', 
          message = "Problem getting ingredients for recipe"
        );
        console.log('Failed to get Ingredients');
      });
  }
});

app.get('/get_ingredient', (req, res) => {
  const term = 'milk';
  axios({
  url: `https://api.kroger.com/v1/products?filter.term=${term}`,
      method: 'GET',
      dataType:'json',
      params: {
          "apikey": req.session.user.api_key,
          "keyword": "milk",
          "size": 1,
      }
  })
  .then(results => {
     res.render('pages/discover',{results:results});
  })
  .catch(error => {
  // Handle errors
      console.log('Failed to discover');
  })
});

// LOGOUT API
app.get('/logout', (req, res) => {
  console.log('GET: /logout'); 
  req.session.destroy();
  res.render('pages/login');
});

app.listen(3000);
console.log('Server is listening on port 3000');