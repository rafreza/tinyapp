const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "aaa": {
    id: "aaa", 
    email: "lulz@example.com", 
    password: "OFWGkta-2012"
  },
  "zzz": {
    id: "zzz", 
    email: "kek@example.com", 
    password: "sadboys-2001"
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("lulz@example.com", testUsers);
    assert.equal(user, testUsers.aaa);
  });
  it('should return undefined when given email does not exist', () => {
    const user = getUserByEmail("why_am_i_here@example.com", testUsers);
    assert.equal(user, undefined);
  });
});