// Dependany imports
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({name: 'session', secret: 'wh1t3-r053-d4rk-4rmy'}));

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

//Functions from helpers.js
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// Object Databases
const urlDatabase = {};
const users = {};


////////////// ROUTING ///////////////

// Home directory, redirects to URLs if logged in, otherwise redirects to registration page
app.get('/', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});
// URL index page that shows all URLs belonging to user after logging in
app.get('/urls', (req,res) => {
  const userID = req.session.userID;
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: userURLs, user: users[userID] };

  if (!userID) res.statusCode = 401;
  
  res.render('urls_index', templateVars);
});
// URL index page after new URL is added to the database
app.post('/urls', (req, res) => {
  if (req.session.userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.userID
    };
    res.redirect(`/urls/${shortURL}`); //redirects to short URL page
  } else {
    const errorMessage = 'Please login to view your new URLs.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
  
});
// Displays page after checking user login status
app.get('/urls/new', (req, res) => {
  if (req.session.userID) {
    const templateVars = {user: users[req.session.userID]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});
//Presents URL details
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = { urlDatabase, userUrls, shortURL, user: users[userID] };

  if (!urlDatabase[shortURL]) {
    const errorMessage = 'Short URL does not exist.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  } else if (!userID || !userUrls[shortURL]) {
    const errorMessage = 'Authorization required, please login to view.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  } else {
    res.render('urls_show', templateVars);
  }
  
});
//Updates long URL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.userID && req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls`);
  } else {
    const errorMessage = 'Authorization required, please login to view.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
  
});
//If link belongs to user, deletes selected URL from database and page
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.userID && req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    const errorMessage = 'Authorization required, please login to view.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
  
});
//Redirects to long URL page
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    const templateVars = { urlDatabase: {}, shortURL: '', user: users[req.session.userID] };
    res.statusCode = 404;
    res.render('urls_show', templateVars);
  }
});

// If logged in, redirects to index page
app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
  res.render('urls_login', templateVars);
});
//If credentials are valid, redirects to index page
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userID = user.userID;
    res.redirect('/urls');
  } else {
    const errorMessage = 'Login credentials not valid. Please enter the correct username and password.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});
//Logs user out and clears cookies, redirects to index page
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('session.sig');
});
//After login, redirects to URLs index page
app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
  res.render('urls_registration', templateVars);
});
// After registration, if credentials are valid redirects to URLs index page
app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.userID = userID;
      res.redirect('/urls');
    } else {
      const errorMessage = 'Cannot create new account, because this email address is already registered.';
      res.status(400).render('urls_error', {user: users[req.session.userID], errorMessage});
    }
  } else {
    const errorMessage = 'Empty username or password. Please fill out both fields.';
    res.status(400).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// Server consoles that it is listening once connected
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});