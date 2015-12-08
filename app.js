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

app.get( '/index', function(req, res) { res.render( 'index')});

app.get( '/sign-up', function(req, res) { res.render( 'sign-up')});


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
            
            foodNames = [];
            foodTypes = [];
            for (var i = 0; i < rows.length; i++)
            {
                if (foodTypes.indexOf(rows[i].food_type_name) == -1)
                {
                    foodTypes.push(rows[i].food_type_name);
                }
                foodNames.push({name: rows[i].name, type: rows[i].food_type_name});
            }
            
            res.render( 'sideBar', {
		        foodType: foodTypes,
		        foodName: foodNames,
		        cache: false
	        });
        });
    
    
    db.close();
});

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
            sqlNameMatch = "stocks.name = '" + req.body[qu[q]] + "'"
        else
        {
            sqlNameMatch = "(";
            //sqlNameMatch = "name = '" + req.body[qu[q]].map(function(x){return x.replace(/\'/g, "''")}).join("' OR name = '") + "'";
            count = 0;
            names = req.body[qu[q]].map(function(x){return x.replace(/\'/g, "''")})
            for (i in names)
            {
                sqlNameMatch += "stocks.name = '" + names[i] + "'";
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

        var numStores = 2; // How to get this number?
        for (var i = 0; i < numStores; i++) {
            sql.push("SELECT * FROM (SELECT store.name AS storeName, store.store_ID, stocks.name AS productName, price FROM stocks INNER JOIN store ON stocks.store_ID=store.store_ID WHERE (" + sqlNameMatch + ") AND price = (SELECT MIN(price) FROM stocks WHERE stocks.store_id = " + i + " AND (" + sqlNameMatch + ")) LIMIT 1)");
        }

        // sql.push("SELECT * FROM (SELECT name, price FROM stocks WHERE (" + sqlNameMatch + ") AND price = (SELECT MIN(price) FROM stocks WHERE " + sqlNameMatch + ") LIMIT 1)");

    }

    db.all(sql.join(" UNION ") + ";", function(err, rows) {
            console.log(err);
            //console.log(rows);
            
            foodList = [];
            stores = [];
            stores_ids_prices = [];

            for (i in rows)
            {
                foodList.push({storeName: rows[i].storeName, productName: rows[i].productName, price: rows[i].price.toFixed(2)});

                if (stores.indexOf(rows[i].storeName) < 0) {
                    stores.push(rows[i].storeName, rows[i].store_ID);
                }
            }

            for (var i = 0; i < stores.length; i += 2) {
                var totalPrice = 0;
                for (r in rows) {
                    if (rows[r].storeName == stores[i]) {
                        totalPrice += rows[r].price;
                    }
                }
                stores_ids_prices.push({storeName: stores[i], storeID: stores[i+1], totalPrice: totalPrice.toFixed(2)});
            }

            console.log(stores_ids_prices);

            res.render( 'itemsSearch', {
		        groceries: foodList,
                storeList: stores_ids_prices,
		        cache: false
	        });
        });
    
    db.close();
});

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
