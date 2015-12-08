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
    
    //clean the list, and sort it into a list of words to require and to exclude
    var cleanedItem = req.param("item").replace(/\'/g, "''");
    console.log(cleanedItem);
    
    var oz = -1;
    var oz_min = -1;
    var oz_max = -1;
    
    sqlQuantity = "";
    
    var oz_range_re = /(\d+\.?\d*|\d*\.\d+)(?:\s)+(?:oz|ounces|ounce)\s*-\s*(\d+\.?\d*|\d*\.\d+)(?:\s)+(?:oz|ounces|ounce)/i;
    var oz_range_matches = oz_range_re.exec(cleanedItem);
    if (oz_range_matches !== null)
    {
        cleanedItem = cleanedItem.replace(oz_range_re, "");
        
        oz_min = oz_range_matches[1];
        oz_max = oz_range_matches[2];
        sqlQuantity += " WHERE " + oz_min + " <= oz AND oz <= " + oz_max;
    }
    else
    {
        var oz_re = /(\d+\.?\d*|\d*\.\d+)(?:\s)+(?:oz|ounces|ounce)/i;
        oz_matches = oz_re.exec(cleanedItem);
        if (oz_matches !== null)
        {
            cleanedItem = cleanedItem.replace(oz_re, "");
            oz = oz_matches[1];
            sqlQuantity += " WHERE oz = " + oz;
        }
    }
    
    cleanedItem = cleanedItem.replace(/\s+/g, " ").trim();
    
    var words = cleanedItem.replace(/[\s]*NOT[\s]+\S+/g, "").split(" ");
    console.log("words = " + words)
    var notWords = cleanedItem.split(" ").filter(function(x){return words.indexOf(x) === -1 && x !== "NOT";});
    console.log("notWords = " + notWords);
    selected = req.param("selected");
    
    sqlAndPieces = [];
    sqlNotPieces = [];

    //generate sql to require words
    for (i in words)
    {
        sqlAndPieces.push("SELECT name, food_type_name, oz FROM product WHERE name LIKE '% " + words[i] + " %'" +
                                                       " OR name LIKE '" + words[i] +" %'" +
                                                       " OR name LIKE '% " + words[i] + "'" +
                                                       " OR name LIKE '" + words[i] + "'");
    }
    
    //generate sql to exclude words
    if (notWords.length !== 0)
    {
        for (i in notWords)
        {
            sqlNotPieces.push("SELECT name, food_type_name FROM product WHERE name LIKE '% " + notWords[i] + " %'" +
                                                           " OR name LIKE '" + notWords[i] +" %'" +
                                                           " OR name LIKE '% " + notWords[i] + "'" +
                                                           " OR name LIKE '" + notWords[i] + "'")
        }
        
        sqlNot = " EXCEPT SELECT * FROM (" + sqlNotPieces.join(" UNION ") + ")";
    }
    else
        sqlNot = ""
    
    
    
    //combine all sql pieces together
    sql = "SELECT name, food_type_name FROM (" + sqlAndPieces.join(" INTERSECT ") + ")" + sqlQuantity + sqlNot + ";";

    console.log(sql);
    db.all(sql,
        function(err, rows) {
            sideHTML = "Filtering:<br>";
            console.log(err);
            foodNames = [];
            foodTypes = [];
            for (var i = 0; i < rows.length; i++)
            {
                if (foodTypes.indexOf(rows[i].food_type_name) === -1)
                {
                    foodTypes.push(rows[i].food_type_name);
                }
                foodNames.push({name: rows[i].name, type: rows[i].food_type_name});
            }
            
            if (foodTypes.length !== 0)
            {
                if (foodTypes.indexOf(selected) === -1)
                {
                    selected = "All";
                }
            }
            else
            {
                foodTypes.push(selected);
            }
            
            res.render( 'sideBar', {
                selected: selected,
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
    
    var sql = [];
    var sqlNameMatch = "";
    for (q in qu)
    {
        sqlNameMatch = "";
    
        if (typeof req.body[qu[q]] === "string")
            sqlNameMatch = "productName = '" + req.body[qu[q]] + "'"
        else
        {
            if (req.body[qu[q]])
            {
                sqlNameMatch = "(";

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
        }

        if (sqlNameMatch !== "")
        {
            var numStores = 2; // How to get this number?
            for (var i = 0; i < numStores; i++) {
                sql.push("SELECT * FROM \
                            (SELECT '" + qu[q] + "' AS query, store.name AS storeName, store.store_ID, stocks.name AS productName, price \
                            FROM stocks INNER JOIN store ON stocks.store_ID = store.store_ID \
                            WHERE (" + sqlNameMatch + ") AND stocks.store_ID = " + i + " \
                            ORDER BY price ASC \
                            LIMIT 1)");
            }
        }
    }
    
    if (sql.length !== 0)
    {
        console.log(sql.join(" UNION ") + ";");

        db.all(sql.join(" UNION ") + ";", function(err, rows) {
                console.log(err);
                console.log(rows);

                foodList = [];
                stores = [];
                stores_ids_prices = [];
                
                for (var i in rows)
                {
                    foodList.push({query: rows[i].query, storeName: rows[i].storeName, productName: rows[i].productName, price: rows[i].price.toFixed(2)});

                    if (stores.indexOf(rows[i].storeName) < 0) {
                        stores.push(rows[i].storeName, rows[i].store_ID);
                    }
                }
            
                var notAtStore = [];
            
                for (var i = 0; i < stores.length; i += 2) {
                    var totalPrice = 0;
                    for (r in rows) {
                        if (rows[r].storeName == stores[i]) {
                            totalPrice += rows[r].price;
                        }
                    }
                
                    var foodAtStore = foodList.filter(function(x){return (x.storeName === stores[i]);});
                    hasAll = (qu.length === foodAtStore.length)
                
                    var queriesAtStore = foodAtStore.map(function(x){return x.query});
                    notAtStore = notAtStore.concat(qu.filter(
                            function(x){return queriesAtStore.indexOf(x) === -1;}).map(
                                function(x){return {storeID: stores[i + 1], query: x};}));
                
                    stores_ids_prices.push({storeName: stores[i], storeID: stores[i+1],
                                        totalPrice: totalPrice.toFixed(2), hasAll: hasAll});
                }       
             
                var  totalPriceComp = function(a, b)
                {
                    return parseFloat(a.totalPrice) - parseFloat(b.totalPrice);
                }
            
                stores_ids_prices = stores_ids_prices.filter(function(x){return x.hasAll;}).sort(totalPriceComp).concat(
                    stores_ids_prices.filter(function(x){return !x.hasAll;}).sort(totalPriceComp));

                res.render( 'itemsSearch', {
                    initiallySelected: stores_ids_prices[0].storeID,
                    groceries: foodList,
                    missingGroceries: notAtStore,
                    storeList: stores_ids_prices,
                    cache: false
                });
            });
    
        db.close();
    }
    else
    {
        res.render( 'itemsSearch', {
                    initiallySelected: 0,
                    groceries: [],
                    missingGroceries: [],
                    storeList: [],
                    cache: false
                });
    }
});

//takes a query, possibleTerms for a user to denote a quantity
//as a single string seperated by "|", and amount to multiply found numbers by
function sqlQuantityRequest(query, possibleTerms, mult)
{
    return ;
}

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
