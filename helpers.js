const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let newString = "";

  while (newString.length < 6) {
    newString += characters[Math.floor(Math.random() * characters.length)];
  }

  return newString;
};

const urlsForUser = (id, database) => {
  const userURLs = {};

  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userURLs[shortURL] = database[shortURL];
    }
  }
  return userURLs;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };