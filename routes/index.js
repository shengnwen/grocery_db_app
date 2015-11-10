// initalize database
// Should this go in another file (db.js)?  Deal with include issues.
var fs = require("fs");
var file = "groceryList.db";
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('groceryList.db');

db.serialize(function() {
  if (!exists) {
    db.run('CREATE TABLE groceries (name VARCHAR(20), updated_at DATE)');
  }
  else {
    db.run('DELETE FROM groceries');
  }
});


// Functions to manage the first user interface
exports.create = function ( req, res ) {
  name = req.body.content;
  var stmt = db.prepare("INSERT INTO groceries VALUES(?, ?)");
  stmt.run(name, Date.now());
  stmt.finalize();
  res.redirect( '/' ); // should this be in a callback?
};

exports.index = function ( req, res ) {
  var groceryList = [];
  db.all("SELECT name FROM groceries", function(err, items) {
    res.render( 'index', {
      title : 'Grocery List',
      items : items
    });
  });
};

exports.destroy = function ( req, res ) {
  db.run("DELETE FROM groceries WHERE name=?", [req.params.id],
    function(err) {
      res.redirect( '/' );
    });
};

exports.edit = function ( req, res ) {
  db.all("SELECT name FROM groceries", function(err, items) {
    res.render( 'edit', {
      title : 'Grocery List',
      items : items,
      current : req.params.id
    });
  });
};

exports.update = function (req, res ) {
  db.serialize(function() {
    db.run("UPDATE groceries SET name = ? WHERE name = ?", [req.body.content, req.params.id]); 
    db.all("SELECT name FROM groceries", function(err, items) { // I don't think I need this query.  Put
      res.redirect( '/' );                                      // callback in db.run()
    });
  });
};
