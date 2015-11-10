var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('groceryList.db');

db.run('CREATE TABLE groceries (name VARCHAR(20), updated_at DATE)');

