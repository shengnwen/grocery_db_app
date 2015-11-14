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
//var routes = require( './routes' );

app.set( 'port', process.env.PORT || 3001 );
app.engine( 'ejs', engine );
app.set('views', __dirname + '/views');
app.set( 'view engine', 'ejs' );
// do we need all of these?  Check what each does individually.
app.use( express.favicon() );
app.use( express.logger( 'dev' ) );
app.use( express.bodyParser() ); // remove this - apparently it isn't safe
app.use( express.json() );
app.use( express.urlencoded() );
app.use( express.methodOverride() );
app.use( app.router );
app.use( express.static( path.join( __dirname, 'public' )) );

app.get( '/', function(req, res) { res.render( 'layout')});
app.get( '/findItems', function(req, res) {res.send(req.param("item").join("/"))});

// send back form
app.get( '/itemChoices', function(req, res) {
	res.send('<input type="checkbox" name="content" value="' + req.param("item") + 
           '" checked> ' + req.param("item")  + '<br>');
});


app.param('item', function(req, res, next, item) {
  console.log('item: %s', item);
  next();
});

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
