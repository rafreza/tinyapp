const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({name: 'session', secret: 'wh1t3-r053-d4rk-4rmy'}));

const bcrypt = require('bcrypt');

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
const findUserInDatabase = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
}

const urlsForUser = (id) => {
  const userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}
/* Sends responses based on URL path */

app.get("/", (req, res) => { //Home
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => { //JSON string for URLDatabase
  res.json(users);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req,res) => {
  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID);
  const templateVars = { urls: userURLs, user: users[userID] };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {user: users[req.session.user_id]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID);
  const templateVars = { urls: userUrls, user: users[userID], shortURL: req.params.shortURL };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
  }
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) res.redirect(longURL);
  else {
    res.statusCode = 404;
    res.send('<h2>404 Not Found!<br>URL does not exist.</h2>');
  }
})

// login page & functionality
app.get('/login', (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const user = findUserInDatabase(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID;
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.send('<h2>403 Forbidden<br>Wrong password.</h2>')
    }
  } else {
    res.statusCode = 403;
    res.send('<h2>403 Forbidden<br>Email address is not registered.</h2>')
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('session.sig');
});

app.get('/register', (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  res.render('urls_registration', templateVars);
});

app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {
    if (!findUserInDatabase(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      }
      req.session.user_id = userID);
      res.redirect('/urls');
    } else {
      res.statusCode = 400;
      res.send('<h2>400 Bad Request<br>Invalid email, it has already been registered.<h2>');
    }
  } else {
    res.statusCode = 400;
    res.send('<h2>400 Bad Request<br>Please fill out all fields for registration.</h2>');
  }  
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});