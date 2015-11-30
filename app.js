// Code borrows heavily from
// http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/
// but modified to use SQL database and simplified file structure

// Other useful resources:
// https://github.com/mapbox/node-sqlite3/wiki/API

var express        = require( 'express' );
var http           = require( 'http' );
var path           = require( 'path' );
var engine         = require( 'ejs-locals' );
var sqlite3        = require('sqlite3').verbose();
var app    = express();

app.set( 'port', process.env.PORT || 3001 );
app.engine( 'ejs', engine );
app.set('views', __dirname + '/views');
app.set( 'view engine', 'ejs' );
app.use( express.logger( 'dev' ) );
app.use( express.urlencoded() );
app.use( express.static( path.join( __dirname, 'public' )) );

app.get( '/', function(req, res) { res.render( 'layout')});

// send back form
app.get( '/itemChoices', function(req, res) {
    db = new sqlite3.Database('groceries.sqlite');
    
    var x;
    
    db.all("SELECT name FROM product WHERE name LIKE '%" + req.param("item") + "%';", function(err, rows) {
            sideHTML = "";
            
            for (var i = 0; i < rows.length; i++)
            {
                sideHTML += '<input type="checkbox" name="content" value="' + rows[i].name + 
                    '" checked> ' + rows[i].name  + '<br>';
            }
            
            res.send(sideHTML);
        });
    
    
    db.close();
});

/*app.get( '/findItems', function(req, res) {
	res.render( 'itemsSearch', {
		groceries: req.param("item")
	});
});*/

app.post('/findItems', function(req, res) {
//	console.log(req.body.product);

    if (typeof req.body.queries === "string")
        qu = [req.body.queries];
    else
	    qu = req.body.queries;
    
    foodList = [];
    
    for (q in qu)
    {
        foodList.push(req.body[q]);
    }
    
    res.render( 'itemsSearch', {
		groceries: foodList,
		cache: false
	});
});

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
