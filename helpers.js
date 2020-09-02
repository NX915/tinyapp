const getUserByEmail = function(email, data) {
  for (const user in data) {
    if (data[user].email === email) {
      return user;
    }
  }
};

module.exports = { getUserByEmail };