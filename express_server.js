const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let newString = "";

  while (newString.length < 6) {
    newString += characters[Math.floor(Math.random() * characters.length)];
  }

  return newString;
}
/* Sends responses based on URL path */

app.get("/", (req, res) => { //Home
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => { //JSON string for URLDatabase
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req,res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']]};
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.updatedURL;
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) res.redirect(longURL);
  else {
    res.statusCode = 404;
    res.send('<h2>404 Not Found!<br>URL does not exist.</h2>');
  }
})

// login functionality
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('urls');
});

app.get('/register', (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_registration', templateVars);
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  users[userID] = {
    userID,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie('user_id', userID);
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});