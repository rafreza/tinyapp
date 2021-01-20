const express = require('express');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http//www.google.com"
};
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
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});