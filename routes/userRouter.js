/**
 * Created by shengwen on 12/10/15.
 */
var express        = require( 'express' );
//var router = express.Router();
var sqlite3        = require('sqlite3').cached;
exports.userLogin = function(req, res) {
    console.log("user login");
    db = new sqlite3.Database('groceries.sqlite');
    var email = req.body.email
    var password = req.body.pwd;
    var sql = "select * from user_ where email = '" + email + "' and password = '" +password+  "';";
    if (!email || !password || email == "" || password == "") {
        res.send("You should enter you email and password!");
        return;
    }
    db.all(sql,function(err,rows){
//rows contain values while errors, well you can figure out.
        if (rows == null || rows.length == 0) {
            console.log("rows is not exist");
            res.send("No this user in database, sorry:)");
            res.redirect('/login');
        } else{
            console.log("rows is  exist:" + rows[0].user_ID);
            req.session.user_id = rows[0].user_ID;
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

