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
    res.redirect('/login');
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
            return res.render('pages/login');
        }
        else {
            console.log('User found and passwords match')
            req.session.user = {
                api_key: process.env.API_KEY,
              };
            req.session.save();
            return res.redirect('/home'); // May change what redirects to
        }
      })
      .catch(err => {
        console.log('Cannot find username');
        res.redirect('/register');
      });
});

// AUTHENTICATION
const auth = (req, res, next) => {
    if (!req.session.user && !req.path.includes("register")) {
      // Default to register as long as current path is not register
      console.log('AUTHENTICATION redirect /register');
      return res.redirect('/register');
    }
    next();
  };
app.use(auth);

// REGISTER GET API
app.get('/register', (req, res) => {
    console.log('GET: /register');
    res.render('pages/register');
});

// REGISTER POST API
app.post('/register', async (req, res) => {
    console.log('POST: /register');

    if (req.body.password != req.body.confirmpassword) {
      console.log('passwords don\'t match')
      console.log(req.body.password);
      console.log(req.body.confirmpassword);
      return res.redirect('/register');
    }

    const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3);'; // May need to change depending on database
    const hash = await bcrypt.hash(req.body.password, 10); // Hashed password
    db.any(query, [
        req.body.username,
        req.body.email,
        hash
    ])
    .then(function (data) {
        console.log('register successful');
        res.redirect('/login');
      })
      .catch(function (err) {
        res.redirect('/register');
        console.log('Failed to register');
      });
  });

// GET HOME
app.get('/home', (req, res) => {
  console.log('GET: /home');
  res.render('pages/home');
});

// Get home/recepies
app.get('/recepies', (req, res) => {
  console.log('GET: /recepies');
  const query = 'SELECT * FROM recepies ORDER BY recepies.recepie_id DESC'
  db.any(query)
  .then(recepies => {
    res.render('pages/recepies',
      recepies,
      message = "sucessfully got recepies"
    );    
  })
  .catch(function (err) {
    res.redirect('/recepies',
    );
    console.log('Failed to GET: /recepies')
  });
});

// POST HOME
app.post('/home', (req, res) => {
  // Recepie Search
  if (req.action = "recepie"){ //will probably need to change
    console.log('Recepie Search')
    const query = 'SELECT * FROM recepies WHERE recepies.recepie_name = $1;';
    db.any(query, [
      req.name
    ])
    .then(function (data) {
        res.render('/home', 
          res.recepie = data,
          res.message = "Sucessfully got Recepie"
        );
      })
      .catch(function (err) {
        res.redirect('/home', 
          res.message = "Unknown Recepie"
        );
        console.log('Failed to search recepie');
      });
  }
  if(req.action = "ingredients"){
    console.log("GET: Ingredients")
    const query = `SELECT * FROM recepies,
    JOIN recepies_to_ingredients, 
      ON recepies.recepie_id = recepies_to_ingredients.recepie_id, 
    JOIN ingredients,
      ON recepies_to_ingredients.ingredient_id = ingredients.ingredient_id,
    WHERE recepies.recepie_name = $1;`;
    db.any(query, [
      req.name
    ])
    .then(function (data) {
        res.render('/home', 
          ingredients = data,
          message = "Sucessfully got Ingredients"
        );
      })
      .catch(function (err) {
        res.redirect('/home', 
          message = "Problem getting ingredients for recepie"
        );
        console.log('Failed to get Ingredients');
      });
  }
});


// LOGOUT API
app.get('/logout', (req, res) => {
  console.log('GET: /logout'); 
  req.session.destroy();
  res.render('pages/login');
});

app.listen(3000);
console.log('Server is listening on port 3000');