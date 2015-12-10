/**
 * Created by shengwen on 12/10/15.
 */
var express        = require( 'express' );
//var router = express.Router();
var sqlite3        = require('sqlite3').cached;
exports.userLogin = function(req, res) {
    db = new sqlite3.Database('groceries.sqlite');
    var email = req.body.email
    var password = req.body.pwd;
    var sql = "select * from user_ where email = '" + email + "' and password = '" +password+  "';";
    db.all(sql,function(err,rows){
//rows contain values while errors, well you can figure out.
        if (rows == null || rows.length == 0) {
            console.log("rows is not exist");
        } else{
            console.log("rows is  exist:" + rows);
            res.session
            res.redirect('/');

        }
    });
    //console.log(sid);
};
exports.addNewUser = function(req, res) {
    db = new sqlite3.Database('groceries.sqlite');
    var email = req.body.email;
    var password = req.body.pwd;
    var username = req.body.username;
    var sql;
    sql = "insert into user_ (username, email, password) values ('" + username + "','" + email + "','" + password + "');";
    console.log(sql);

    db.serialize(function() {
        db.run(sql);
    });
    console.log("add new user!");
    res.redirect('/login');//('login');
};

