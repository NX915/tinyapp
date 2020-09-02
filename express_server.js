const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));
app.set("view engine", "ejs");

const findUserWithEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
};

const checkIsURLOwner = function(req) {
  return req.cookies.userID === urlDatabase[req.params.shortURL].userID;
};

const generateRandomString = function() {
  return Math.random().toString().slice(2, 8);
};

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "123456"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "123456"}
};

const users = {
  '123456': {
    id: '123456',
    email: '1@1.com',
    password: '$2b$10$H4n1///D3KAOPv4VXp7D6Ool0SzjgnCasHJ/KUhHXnmqOaMg5gyHa'
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = {user: users[req.cookies['userID']]};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '' || findUserWithEmail(req.body.email)) {
    res.sendStatus(400);
  } else {
    const userID = generateRandomString();
    const { password, email } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[userID] = {
      id: userID,
      email,
      password: hashedPassword
    };
    console.log(users);
    res.cookie('userID', userID);
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const userID = findUserWithEmail(req.body.email);
  if (req.body.email === '' || req.body.password === '' || userID === undefined || users[userID].password !== req.body.password) {
    res.sendStatus(400);
  } else {
    res.cookie('userID', userID);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.cookies['userID']]};
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies['userID']]};
  if (users[req.cookies['userID']] === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['userID']],
  };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  if (req.body.longURL.slice(0, 7) !== 'http://' || req.body.longURL.slice(0, 8) !== 'https://') {
    req.body.longURL = `https://${req.body.longURL}`;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.cookies.userID};
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (checkIsURLOwner(req)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
  res.sendStatus(400);
});

app.post("/urls/:shortURL", (req, res) => {
  if (checkIsURLOwner(req)) {
    let newLongURL = req.body.longURL;
    if (req.body.longURL.slice(0, 7) !== 'http://' || req.body.longURL.slice(0, 8) !== 'https://') {
      newLongURL = `https://${req.body.longURL}`;
    }
    urlDatabase[req.params.shortURL].longURL = newLongURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
  res.sendStatus(400);
});

app.get("/urls/:shortURL", (req, res) => {
  if (checkIsURLOwner(req)) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.cookies['userID']],
    };
    res.render("urls_show", templateVars);
  }
  res.sendStatus(400);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});