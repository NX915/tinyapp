const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['this is a long ass password', 'we do not like to remember passwords']
}));
app.use(morgan('dev'));
app.set("view engine", "ejs");


const checkIsURLOwner = function(req) {
  if (urlDatabase[req.params.shortURL]) {
    return req.session.userID === urlDatabase[req.params.shortURL].userID;
  }
  return false;
};

const generateRandomString = function(length = 6) {
  const charString = 'abcdefghijklmnopqretuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    randomString += charString[Math.floor(Math.random() * charString.length)];
  }
  return randomString;
};

const urlDatabase = {
  "dF3rE2": {longURL: "https://developer.mozilla.org", userID: "123456"},
  "dsf3Fs": {longURL: "https://www.freecodecamp.org", userID: "123456"},
  "WdgEfo": {longURL: "https://www.apple.ca", userID: "123456"},
  "b2xVn2": {longURL: "https://www.lighthouselabs.ca", userID: "123456"},
  "3IZ5yf": {longURL: "https://www.youtube.ca", userID: "123456"},
  "9sm5xK": {longURL: "https://www.google.com", userID: "123456"}
};

const users = {
  '123456': {
    id: '123456',
    email: 'test@test.com',
    password: '$2b$10$Mt4Q947MdJlpMw03bsCOe.7B/tkfi52tdyqqvnc6ziTk5pUc./LRy'
  }
};

app.get("/", (req, res) => {
  const { userID } = req.session;
  if (users[userID]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL] ? urlDatabase[req.params.shortURL].longURL : undefined;
  if (longURL === undefined) {
    res.sendStatus(404);
  } else {
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  if (users[req.session.userID]) {
    res.redirect("/urls");
  } else {
    let templateVars = {user: users[req.session['userID']]};
    res.render("urls_register", templateVars);
  }
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
    req.session.userID = userID;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { password, email } = req.body;
  const userID = getUserByEmail(email, users);
  if (email === '' || password === '' || userID === undefined || !bcrypt.compareSync(password, users[userID].password)) {
    res.sendStatus(400);
  } else {
    req.session.userID = userID;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.session['userID']]};
  if (users[req.session.userID]) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/logout", (req, res) => {
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
  if (req.body.longURL.slice(0, 7) !== 'http://' && req.body.longURL.slice(0, 8) !== 'https://') {
    req.body.longURL = `https://${req.body.longURL}`;
  }
  let shortURL = generateRandomString();
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.userID};
  res.redirect(`/urls/${shortURL}`);
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
    if (req.body.longURL.slice(0, 7) !== 'http://' && req.body.longURL.slice(0, 8) !== 'https://') {
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});