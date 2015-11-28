// Code borrows heavily from
// http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/
// but modified to use SQL database and simplified file structure

// Other useful resources:
// https://github.com/mapbox/node-sqlite3/wiki/API

var express        = require( 'express' );
var http           = require( 'http' );
var path           = require( 'path' );
var engine         = require( 'ejs-locals' );
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
	res.send('<input type="checkbox" name="content" value="' + req.param("item") + 
           '" checked> ' + req.param("item")  + '<br>');
});

/*app.get( '/findItems', function(req, res) {
	res.render( 'itemsSearch', {
		groceries: req.param("item")
	});
});*/

app.post('/findItems', function(req, res) {
//	console.log(req.body.product);

    if (typeof req.body.product === "string")
        res.render( 'itemsSearch', {
		    groceries: [req.body.product],
		    cache: false
	    });
    else
	    res.render( 'itemsSearch', {
		    groceries: req.body.product,
		    cache: false
	    });
	console.log(req.body.product);
});

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
