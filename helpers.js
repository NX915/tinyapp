const getUserByEmail = function(email, data) {
  for (const user in data) {
    if (data[user].email === email) {
      return user;
    }
  }
  return null;
};

module.exports = { getUserByEmail };