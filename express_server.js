const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({name: 'session', secret: 'wh1t3-r053-d4rk-4rmy'}));

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

const urlDatabase = {};
const users = {};


/* Sends responses based on URL path */

app.get('/', (req, res) => { //Home
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req,res) => {
  const userID = req.session.userID;
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: userURLs, user: users[userID] };

  if (!userID) res.statusCode = 401;
  
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if (req.session.userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.userID
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    const errorMessage = 'Please login to view your new URLs.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
  
});

app.get('/urls/new', (req, res) => {
  if (req.session.userID) {
    const templateVars = {user: users[req.session.userID]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

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

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    const templateVars = { urlDatabase: {}, shortURL: '', user: users[req.session.userID] };
    res.statusCode = 404;
    res.render('urls_show', templateVars);
  }
});

// login page & functionality
app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
  res.render('urls_login', templateVars);
});

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

app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('session.sig');
});

app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
  res.render('urls_registration', templateVars);
});

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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});