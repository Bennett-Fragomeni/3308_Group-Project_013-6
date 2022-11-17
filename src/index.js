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

async function getPriceByIngredientName(ingredientName) {
  const output = await axios({
    "async": true,
    "crossDomain": true,
    "url": "https://api-ce.kroger.com/v1/connect/oauth2/token",
    "method": "POST",
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${btoa(process.env.CLIENT_ID.concat(':').concat(process.env.CLIENT_SECRET))}`
    },
    "data": {
      "grant_type": "client_credentials",
      "scope": "product.compact"
    }
  });

  const response = await axios({
    "async": true,
    "crossDomain": true,
    "url": `https://api-ce.kroger.com/v1/products?filter.term=${ingredientName}&filter.locationId=62000061`, //&filter.locationId={{LOCATION_ID}}
    "method": "GET",
    "headers": {
      "Accept": "application/json",
      "Authorization": `Bearer ${output.data.access_token}`
    }
  });

  console.log('got access token succesfully')
    
  var lowestPrice = 0;
  var size;
  var results = response.data.data;

  if (results == [])
    return {price: 'No price found', size: ''};

  results.forEach(async (ingredient) => {
    ingredient.items.forEach(async (item) => {
      if (!('price' in item))
        return;
          
      var newPrice = item.price.promo == 0 ? item.price.regular : item.price.promo;
  
      if (newPrice < lowestPrice || lowestPrice == 0) {
        lowestPrice = newPrice
        size = item.size
      }
    })
  });

  if (lowestPrice == 0)
    return {price: 'No price found', size: ''};

  console.log(lowestPrice);

  return {price: lowestPrice, size: size};
}

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

const user = {
  user_id: null,
  username: null,
  email: null,
  user_id: null
};

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

// AUTHENTICATION
const auth = (req, res, next) => {
  if (typeof(req.session.user) == "undefined") {
    // Default to register as long as current path is not register
    console.log('AUTHENTICATION redirect /register');
    return false; //if the session user is undefined return false
  }
  else{
    return true; //if the session user is defined return true
  }
};


// BASE API
app.get('/', (req, res) =>{

  console.log('GET: /');
  if(auth(req)){
    res.render('pages/home', {
      auth: true
    });
  }
  else{
    res.render('pages/login', {
      auth: false
    });
  }
});
  
// LOGIN GET API
app.get('/login', (req, res) => {
    console.log('GET: /login');

    res.render('pages/login', {
      auth: false
    });
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
              error: true,
              auth: false
            });
        }
        else {
            console.log('User found and passwords match')
            user.user_id = data[0].user_id;
            user.username = data[0].username;
            user.email = data[0].email;
            user.user_id = data[0].user_id;
            
            req.session.user = user;
            req.session.save();
            res.redirect('/home'); // May change what redirects to
        }
      })
      .catch(err => {
        console.log('Cannot find username');
        res.render('pages/login', {
          message: 'Incorrect username or password',
          error: true,
          auth: false
        });
      });
});



// REGISTER GET API
app.get('/register', (req, res) => {
    console.log('GET: /register');

    console.log(req.message);
    if(req.message){
      res.render('pages/register', {
        auth: false
      });
    }else{
      res.render('pages/register', {
        auth: false
      });
    }
    

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
        message: 'Passwords do not match',
        auth: false
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
        message: "Failed to register",
        auth: false

      })
    });
  });

// GET HOME
app.get('/home', (req, res) => {
  console.log('GET: /home');
  if(auth(req)){
    res.render('pages/home', {
      auth: true
    });
  }
  else{
    res.render('pages/login', {
      message: "Please Login Before Continuing",
      auth: false
    });
  }
});

// GET /recipes
app.get('/recipes', (req, res) => {

  console.log('GET: /recipes');

  if(auth(req)){
    const query = 'SELECT * FROM recipes ORDER BY recipes.recipe_id DESC'
    db.any(query)
    .then(recipes => {
      //Sending the Cart data back to the recipes page
      const query2 = `SELECT recipe_name FROM users  
      INNER JOIN cart ON cart.user_id = users.user_id 
      INNER JOIN recipes ON recipes.recipe_id = cart.recipe_id 
      WHERE users.user_id = $1;`;
      console.log("CART U_ID: ", user.user_id);
      db.any(query2, [user.user_id])
      .then(cart => {
        res.render('pages/recipes', {
          recipes: recipes,
          cart: cart,
          auth: true
        })
      })
    })
    .catch(function (err) {
      res.redirect('/home',
      );
      console.log('Failed to GET: /recipes')
    });
  }
  else{
    res.render('pages/login', {
      message: "Please Login Before Continuing",
      auth: false
    });
  }
});

// POST Recepies
app.post('/recipes', (req,res) => {
    console.log(req.body.search);
    const query = 'SELECT * FROM recipes WHERE position(LOWER($1) in LOWER(recipe_name)) > 0 ORDER BY recipes.recipe_id DESC;';
    db.any(query, [
        req.body.search
    ])
    .then(recipes => {
        console.log(recipes);
        res.render('pages/recipes', {
            recipes: recipes,
            auth: true
        }); 
    })
    .catch(function (err) {
        res.redirect('/recipes');
        console.log('Failed to POST: /recipes')
    });
});

// POST Recepies/cart
app.post('/recipes/cart', (req,res) => {
  console.log('POST: /recipes/cart');
  const query = "INSERT INTO cart (user_id, recipe_id) VALUES ($1, $2);";
  db.any(query, [
    user.user_id, 
    req.body.recipe_id
  ])
  .then(data => {
    res.redirect('/recipes')
  })
  .catch(function (err) {
    console.log('Failed to POST: /recipes/cart');
    console.log(err);
  });
});

// GET View Recepie
app.get('/view_recipe', async (req, res) => {
  console.log('GET: view_recipe');
  console.log(req.query.recipe_id);
  var recipeID = req.query.recipe_id;

  const query1 = 'SELECT * FROM recipes WHERE recipe_id = $1'
  const query2 = 'SELECT quantity, ingredient_name, unit_name FROM (recipe_to_ingredients ri INNER JOIN ingredients i ON ri.ingredient_id = i.ingredient_id) rii INNER JOIN units u ON rii.unit_id = u.unit_id WHERE recipe_id = $1';

  db.any(query1, [
    recipeID
  ])
  .then(async (data1) => {
    //console.log(data1);
    if (!data1) {
      console.log("No recipe found")
      return res.redirect('/recipes');
    }
    db.any(query2, [
      recipeID
    ])

    .then(async (ingredients) => { 
      console.log(ingredients);
      var promises = []

      async function getPrice(ingredient) {
        var priceSize = await getPriceByIngredientName(ingredient.ingredient_name);
        ingredient.price = priceSize.price;
        ingredient.size = priceSize.size;
        return ingredient
      }
      
      for (const ingredient of ingredients) {
        promises.push(getPrice(ingredient))
      }

      const responses = await Promise.all(promises);

      console.log(ingredients);

      if (!ingredients)

        return console.log("No ingredients found")
      res.render('pages/view_recipe', {
        recipe: data1[0],
        ingredients: ingredients,
        auth: true
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

// GET Create Recepie 
app.get('/create_recipe', (req, res) => {
  console.log('GET: create_recipe');
  if(auth(req)){
      res.render('pages/create_recipe', {
      auth: true
    });
  }
  else{
    res.render('pages/login', {
      message: "Please Login Before Continuing",
      auth: false
    });
  }
});

// POST Create Recepie
app.post('/create_recipe', (req, res) => {
  console.log('POST: create_recipe');
  console.log(req.body.recipe_name);
  console.log(req.body);
  const recipe_query = 'INSERT INTO recipes (recipe_name, recipe_desc, recipe_img_url) VALUES ($1,$2,$3)';
  const ingredient_query = 'INSERT INTO ingredients(ingredient_name) VALUES ($1);';
  const ingredient_to_recipe_query = 'INSERT INTO recipe_to_ingredients (recipe_id, ingredient_id,quantity,unit_id) VALUES ( (SELECT recipe_id FROM recipes WHERE recipe_name = $1 LIMIT 1), (SELECT ingredient_id FROM ingredients WHERE ingredient_name = $2 LIMIT 1),$3,(SELECT unit_id FROM units WHERE unit_name = $4 LIMIT 1) );';
  const unit_query = 'INSERT INTO units (unit_name) VALUES ($1);';
  // Queries to add ingredients and recipes, as well as units and update the ingredient_to_recipe table.
  let ingredients = req.body.ingredients;

  db.any(recipe_query, [
    req.body.recipe_name,
    req.body.recipe_desc,
    req.body.recipe_img_url
  ])
  .then(function (data) {
    console.log('Recipe added');
    // Adds recipe to database

    ingredients.forEach(ing => {
    db.any(ingredient_query, [
      ing.ingredientName
    ])
    .then(function (data2) {
      console.log('Ingredients added');
      // Adds ingredients to database

      db.any(unit_query, [
        ing.unit
      ])
      .then(function (data3) {
        console.log('Updated units');
        // Updates recipe_to_ingredients table

        db.any(ingredient_to_recipe_query, [
          req.body.recipe_name,
          ing.ingredientName,
          ing.quantity,
          ing.unit
        ])
        .then(function (data4) {
          console.log('recipe_to_ingredients updated');
          // Updates units using query
        })
        .catch(function(err) {
          console.log('Failed to update recipe_to_ingredients')
        });
      })
      .catch(function(err) {
        console.log('Failed to update units');
      });


    })
    .catch(function (err) {
      res.redirect('/create_recipe');
      console.log('Failed to add ingredients');
    });
    // Adds ingredients to database

  });

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
        res.render('pages/home', 
          res.recipe = data,
          res.message = "Sucessfully got recipe",
          res.auth = true
        );
      })
      .catch(function (err) {
        res.render('pages/home', 
          res.message = "Unknown recipe",
          res.auth = true
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
          message = "Sucessfully got Ingredients",
          res.auth = true
        );
      })
      .catch(function (err) {
        res.render('pages/home', 
          message = "Problem getting ingredients for recipe",
          res.auth = true
        );
        console.log('Failed to get Ingredients');
      });
  }
});

// GET recipe info based on entries on cart table that match the user's id
app.get('/cart', (req, res) => {
  console.log('GET: cart');
  if(auth(req)){
    const query = 'SELECT recipes.* FROM recipes,cart WHERE cart.user_id = $1 AND cart.recipe_id = recipes.recipe_id;';
    db.any (query, [
      req.session.user.user_id
    ])
    .then(function (data) {
      console.log(data);
      res.render('pages/cart', {
        recipes: data,
        auth: true
      });
    })
    .catch(function (err) {
      console.log('Failed to get cart');
    });
  } else {
    res.redirect('pages/login', {
      message: "Please Login Before Continuing",
      auth: false
    });
  }
});

// POST recipe_id to cart table with the respective user_id
app.post('/cart/add', (req, res) => {
  console.log('POST: cart');
  if(auth(req)){
    const query = 'INSERT INTO cart (user_id, recipe_id) VALUES ($1, $2);';
    db.any (query, [
      req.session.user.user_id,
      req.body.recipe_id
    ])
    .then(function (data) {
      console.log('Added to cart');
      res.redirect('/recipes');
    })
    .catch(function (err) {
      console.log('Failed to add to cart');
    });
  } else {
    res.redirect('pages/login', {
      message: "Please Login Before Continuing",
      auth: false
    });
  }
});

// REMOVE selected entry from cart table
app.post('/cart/delete', (req, res) => {
  console.log('DELETE: remove_from_cart');
  if(auth(req)){
    const query = 'DELETE FROM cart WHERE user_id = $1 AND recipe_id = $2;';
    db.any (query, [
      req.session.user.user_id,
      req.body.recipe_id
    ])
    .then(function (data) {
      console.log('Removed from cart');
      res.redirect('/cart');
    })
    .catch(function (err) {
      console.log('Failed to remove from cart');
    });
  } else {
    res.redirect('pages/login', {
      message: "Please Login Before Continuing",
      auth: false
    });
  }
});


// LOGOUT API
app.get('/logout', (req, res) => {
  console.log('GET: /logout'); 
  req.session.destroy();
  res.render('pages/login', {
    auth: false
  });
});

app.listen(3000);
console.log('Server is listening on port 3000');
