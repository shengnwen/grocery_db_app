// Code borrows heavily from
// http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/
// but modified to use SQL database and simplified file structure

// Other useful resources:
// https://github.com/mapbox/node-sqlite3/wiki/API

// Notes:
// -maybe have unique ID for each item on the list.  Otherwise
//  there is the risk of confusion over having the same item twice.
//  Use this instead of the "Date" field?

//require( './db');

var express        = require( 'express' );
var http           = require( 'http' );
var path           = require( 'path' );
var engine         = require( 'ejs-locals' );
var app    = express();
var routes = require( './routes' );

app.set( 'port', process.env.PORT || 3001 );
app.engine( 'ejs', engine );
app.set('views', __dirname + '/views');
app.set( 'view engine', 'ejs' );
// do we need all of these?  Check what each does individually.
app.use( express.favicon() );
app.use( express.logger( 'dev' ) );
app.use( express.bodyParser() );
app.use( express.json() );
app.use( express.urlencoded() );
app.use( express.methodOverride() );
app.use( app.router );
app.use( express.static( path.join( __dirname, 'public' )) );

// routes
//app.get( '/', routes.index );
app.post( '/create', routes.create );
app.get( '/destroy/:id', routes.destroy );
app.get( '/edit/:id', routes.edit );
app.post( '/update/:id', routes.update );

app.get( '/', routes.index );

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
