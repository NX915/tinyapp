const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['this is a long ass password', 'we do not like to remember passwords']
}));
app.use(morgan('dev'));
app.set("view engine", "ejs");

const getUserByEmail = function(email, data) {
  for (const user in data) {
    if (data[user].email === email) {
      return user;
    }
  }
  return null;
};

const checkIsURLOwner = function(req) {
  return req.session.userID === urlDatabase[req.params.shortURL].userID;
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
    password: '$2b$10$JyobYzcfUA0wXaxOoU3ZAeVAEd6g2/WneWxdNdye/.C2bEb4hNroa'
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
  let templateVars = {user: users[req.session['userID']]};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '' || getUserByEmail(email, users)) {
    res.sendStatus(400);
  } else {
    let randomString = generateRandomString();
    while (users[randomString]) {
      randomString = generateRandomString();
    }
    const userID = randomString;
    const { password, email } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[userID] = {
      id: userID,
      email,
      password: hashedPassword
    };
    console.log(users);
    // res.cookie('userID', userID);
    req.session.userID = userID;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { password, email } = req.body;
  const userID = getUserByEmail(email, users);
  if (email === '' || password === '' || !userID || !bcrypt.compareSync(password, users[userID].password)) {
    res.sendStatus(400);
  } else {
    // res.cookie('userID', userID);
    req.session.userID = userID;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.session['userID']]};
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  // res.clearCookie('userID');
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.session['userID']]};
  if (users[req.session['userID']] === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session['userID']],
  };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  if (req.body.longURL.slice(0, 7) !== 'http://' || req.body.longURL.slice(0, 8) !== 'https://') {
    req.body.longURL = `https://${req.body.longURL}`;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.userID};
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
  } else {
    res.sendStatus(400);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (checkIsURLOwner(req)) {
    let newLongURL = req.body.longURL;
    if (req.body.longURL.slice(0, 7) !== 'http://' || req.body.longURL.slice(0, 8) !== 'https://') {
      newLongURL = `https://${req.body.longURL}`;
    }
    urlDatabase[req.params.shortURL].longURL = newLongURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  } else {
    res.sendStatus(400);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (checkIsURLOwner(req)) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session['userID']],
    };
    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(400);
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});