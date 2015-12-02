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
    
    cleanedItem = req.param("item").replace(/\'/g, "''");
    
    db.all("SELECT name, food_type_name FROM product WHERE name LIKE '% " + cleanedItem + " %'" +
                                                       "OR name LIKE '" + cleanedItem +" %'" +
                                                       "OR name LIKE '% " + cleanedItem + "'" +
                                                       "OR name LIKE '" + cleanedItem + "';",
        function(err, rows) {
            sideHTML = "Filtering:<br>";
            
            foodTypes = [];
            for (var i = 0; i < rows.length; i++)
            {
                if (foodTypes.indexOf(rows[i].food_type_name) == -1)
                {
                    foodTypes.push(rows[i].food_type_name);
                }
            }
            
            sideHTML += '<select id="food_type_selector">'
            sideHTML += '<option selected = "selected" value="All">All</option><br>';
            for (var i = 0; i < foodTypes.length; i++)
            {
                sideHTML += '<option value="' + foodTypes[i] + 
                    '">' + foodTypes[i]  + '</option><br>';
            }
            
            sideHTML += "</select><hr>";
            
            for (var i = 0; i < rows.length; i++)
            {
                sideHTML += '<input type="checkbox" class="' + rows[i].food_type_name + '" name="content" value="' + rows[i].name + 
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

    if (typeof req.body.queries === "string")
        qu = [req.body.queries];
    else
	    qu = req.body.queries;
    
    db = new sqlite3.Database('groceries.sqlite');
    
    sql = [];
    for (q in qu)
    {
        if (typeof req.body[qu[q]] === "string")
            sqlNameMatch = "name = '" + req.body[qu[q]] + "'"
        else
        {
            sqlNameMatch = "(";
            //sqlNameMatch = "name = '" + req.body[qu[q]].map(function(x){return x.replace(/\'/g, "''")}).join("' OR name = '") + "'";
            count = 0;
            names = req.body[qu[q]].map(function(x){return x.replace(/\'/g, "''")})
            for (i in names)
            {
                sqlNameMatch += "name = '" + names[i] + "'";
                if (i != names.length - 1)
                {
                    count += 1;
                    if (count === 10)
                    {
                        sqlNameMatch += ") OR ("
                        count = 0;
                    }
                    else
                        sqlNameMatch += " OR ";
                }
            }
            sqlNameMatch += ")"
        }

        sql.push("SELECT * FROM (SELECT name, price FROM stocks WHERE (" + sqlNameMatch + ") AND price = (SELECT MIN(price) FROM stocks WHERE " + sqlNameMatch + ") LIMIT 1)");
    }
    
    db.all(sql.join(" UNION ") + ";", function(err, rows) {
            console.log(err);
            console.log(rows);
            
            foodList = [];
            totalPrice = 0;
            for (i in rows)
            {
                foodList.push({name: rows[i].name, price: rows[i].price.toFixed(2)});
                totalPrice += rows[i].price;
            }

            totalPrice = totalPrice.toFixed(2);
            
            res.render( 'itemsSearch', {
		        groceries: foodList,
                total: totalPrice,
		        cache: false
	        });
        });
    
    db.close();
});

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
