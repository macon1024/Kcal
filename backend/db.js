const Datastore = require('nedb-promises');
const path = require('path');

const dbPath = path.join(__dirname, 'data');

const foods = Datastore.create(path.join(dbPath, 'foods.db'));
const logs = Datastore.create(path.join(dbPath, 'logs.db'));
const users = Datastore.create(path.join(dbPath, 'users.db'));

module.exports = {
  foods,
  logs,
  users
};
