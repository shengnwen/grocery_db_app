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
var userRouter     = require("./routes/userRouter");
var app    = express();

app.set( 'port', process.env.PORT || 3001 );
app.engine( 'ejs', engine );
app.set('views', __dirname + '/views');
app.set( 'view engine', 'ejs' );
app.use( express.logger( 'dev' ) );
app.use( express.urlencoded() );
app.use( express.static( path.join( __dirname, 'public' )) );

app.use(express.cookieParser('1234567890QWERTY'));
app.use(express.session());
app.post("/userLogIn", userRouter.userLogin);
app.post("/addNewUser", userRouter.addNewUser);
app.get( '/', function(req, res) {
        if (req.session.user_id) {
            res.render('layout',
                        {user_id: req.session.user_id})
        } else {
            res.redirect('/login');
        }
    }
);

app.get( '/setdefault', function(req, res) { req.session.user_id = -1;
                                             res.redirect( '/')});
app.get( '/index', function(req, res) { res.render( 'index')});
app.get( '/sign-up', function(req, res) { res.render( 'sign-up')});
app.get( '/login', function(req, res) { res.render( 'login')});
app.get('/showHistory', userRouter.showShoppingLists);
app.get('/createShoppingList', userRouter.createShoppingList);
app.get( '/itemChoices', function(req, res) {
    db = new sqlite3.Database('groceries.sqlite');

    var x;
    
    //clean the list, and sort it into a list of words to require and to exclude
    var cleanedItem = req.param("item").replace(/\'/g, "''");
    
    sqlQuantity = [];
    terms = [["oz|ounces|ounce", "oz", 1],
             ["lb|pounds|pound", "oz",  16],
             ["fl.?\\s?oz.?|fluid\\s?ounces", "fl_oz",  1],
             ["qt|quarts|quart", "fl_oz", 32],
             ["gallons|gallon|gal", "fl_oz", 128],
             ["ml|milliliters|milliliter", "fl_oz", .033814],
             ["liters|liter|l", "fl_oz", 33.814],
             ["boxes|box|count|ct|packs|pack|pk|pc|bags|bag|pieces|piece|bars|sticks", "count", 1]];
    
    for (i in terms)
    {
        var r = sqlQuantityRequest(cleanedItem, terms[i][0], terms[i][1], terms[i][2]);
        if (r.quantity !== "")
        {
            sqlQuantity.push(r.quantity);
        }
        cleanedItem = r.cleanedQuery;
    }
    
    if (sqlQuantity.length !== 0)
        sqlQuantity = " WHERE " + sqlQuantity.join(" OR ");
    
    cleanedItem = cleanedItem.replace(/\s+/g, " ").trim();
    
    var words = cleanedItem.replace(/[\s]*NOT[\s]+\S+/g, "").split(" ");
    var notWords = cleanedItem.split(" ").filter(function(x){return words.indexOf(x) === -1 && x !== "NOT";});
    selected = req.param("selected");
    
    sqlAndPieces = [];
    sqlNotPieces = [];
    
    sqlAndPieces.push();
    //generate sql to require words
    for (i in words)
    {
        sqlAndPieces.push(" (product_name LIKE '% " + words[i] + " %'" +
                          " OR product_name LIKE '" + words[i] +" %'" +
                          " OR product_name LIKE '% " + words[i] + "'" +
                          " OR product_name LIKE '" + words[i] + "')");
    }
    
    //generate sql to exclude words
    if (notWords.length !== 0)
    {
        for (i in notWords)
        {
            sqlNotPieces.push("(product_name LIKE '% " + notWords[i] + " %'" +
                              " OR product_name LIKE '" + notWords[i] +" %'" +
                              " OR product_name LIKE '% " + notWords[i] + "'" +
                              " OR product_name LIKE '" + notWords[i] + "')")
        }
        
        sqlNot = " EXCEPT SELECT * FROM (SELECT product_name, food_type_name FROM product WHERE" + sqlNotPieces.join(" OR ") + ")";
    }
    else
        sqlNot = ""
    
    
    
    //combine all sql pieces together
    sql = "SELECT product_name, food_type_name FROM (SELECT product_name, food_type_name, oz, fl_oz, count FROM product WHERE" + sqlAndPieces.join(" AND ") + ")" + sqlQuantity + sqlNot + ";";
    //console.log(sql);
    db.all(sql,
        function(err, rows) {
            sideHTML = "Filtering:<br>";

            foodNames = [];
            foodTypes = [];
            for (var i = 0; i < rows.length; i++)
            {
                if (foodTypes.indexOf(rows[i].food_type_name) === -1)
                {
                    foodTypes.push(rows[i].food_type_name);
                }
                foodNames.push({name: rows[i].product_name, type: rows[i].food_type_name});
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
            
            queryHistory = "SELECT food_type_name FROM user_query_history WHERE user_ID = " + req.session.user_id + " AND query = '" + cleanedItem + "';"
            db.all(queryHistory,
                function(err2, rows2) {
                    var defaultFilter = "All";
                    if (rows2.length !== 0 && req.session.user_id !== -1)
                    {
                        defaultFilter = rows2[0].food_type_name;
x                    }
                
                    res.render( 'sideBar', {
                    selected: selected,
		            foodType: foodTypes,
		            foodName: foodNames,
		            selected: defaultFilter,
		            cache: false
	            });
	        })
        });
    
    
    db.close();
});

app.post('/findItems', function(req, res) {
    
    
    if (typeof req.body.queries === "string")
        qu = [req.body.queries];
    else
	    qu = req.body.queries;
    
    db = new sqlite3.Database('groceries.sqlite');
        
    var optimize, valuePrepend, valueAppend, fromAddition, decimals;
    
    if (req.body.optimize === "calories")
    {
        optimize = "calories";
        fromAddition = "product NATURAL JOIN";
        valuePrepend = "";
        valueAppend = " Cal";
        decimals = 0;
    }
    else
    {
        optimize = "price";
        fromAddition = "";
        valuePrepend = "$";
        valueAppend = "";
        decimals = 2;
    }
    
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
                    sqlNameMatch += "product_name = '" + names[i] + "'";
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
                            (SELECT '" + qu[q] + "' AS query, '" + req.body[qu[q] + "Filter"] + "' AS queryType, store_name AS storeName, store_ID, product_name AS productName, " + optimize + " AS optimize, URL \
                            FROM " + fromAddition + " stocks NATURAL JOIN store\
                            WHERE (" + sqlNameMatch + ") AND optimize IS NOT NULL AND store_ID = " + i + " \
                            ORDER BY optimize ASC \
                            LIMIT 1)");
            }
        }
    }
    
    if (sql.length !== 0)
    {
        //console.log(sql.join(" UNION ") + ";");
        
        db.serialize(function() {
            var sql = "insert into shopping_list(user_ID, created_date) values("+ req.session.user_id + ", Date('now'));";
            db.run(sql);
            sql = "select * from shopping_list where user_ID = " + req.session.user_id;
            db.all(sql, function(err, rows){
                var size = rows.length;
                if (size != 0) {
                    console.log("create shopping list id:" + rows[size - 1].list_ID);
                    req.session.list_id = rows[size - 1].list_ID;
                    //res.redirect('/');
                }
            });
        });

        db.all(sql.join(" UNION ") + ";", function(err, rows) {
                console.log(err);
                
                if (rows.length === 0)
                {
                    res.render( 'itemsSearch', {
                        initiallySelected: 0,
                        groceries: [],
                        missingGroceries: [],
                        storeList: [],
                        valuePrepend: valuePrepend,
                        valueAppend: valueAppend,
                        cache: false
                    });
                    return;
                }

                foodList = [];
                stores = [];
                stores_ids_prices = [];
                
                var addedToList = [];

                for (var i in rows)
                {
                    foodList.push({query: rows[i].query, storeName: rows[i].storeName, productName: rows[i].productName, price: rows[i].optimize.toFixed(decimals), url: rows[i].URL});

                    if (stores.indexOf(rows[i].storeName) < 0) {
                        stores.push(rows[i].storeName, rows[i].store_ID);
                    }
                    
                    if (typeof req.session.user_id !== 'undefined')
                    {
                        addToHistory  = "INSERT INTO user_query_history (user_ID, query, food_type_name) \
                                VALUES (" + req.session.user_id + ", '" + rows[i].query.replace(/\'/g, "''") + "', '" + rows[i].queryType.replace(/\'/g, "''") + "');";
                        db.run(addToHistory);
                        
                        var newName = rows[i].productName.replace(/\'/g, "''")
                        if (addedToList.indexOf(newName) === -1)
                        {
                            addToList = "INSERT INTO list_items (list_ID, product_name) \
                                    VALUES (" + req.session.list_id + ", '" + newName + "');";
                            addedToList.push(newName);
                        }
                        db.run(addToList);
                    }
                }
                
                var notAtStore = [];
            
                for (var i = 0; i < stores.length; i += 2) {
                    var totalPrice = 0;
                    for (r in rows) {
                        if (rows[r].storeName == stores[i]) {
                            totalPrice += rows[r].optimize;
                        }
                    }
                
                    var foodAtStore = foodList.filter(function(x){return (x.storeName === stores[i]);});
                    hasAll = (qu.length === foodAtStore.length)
                
                    var queriesAtStore = foodAtStore.map(function(x){return x.query});
                    notAtStore = notAtStore.concat(qu.filter(
                            function(x){return queriesAtStore.indexOf(x) === -1;}).map(
                                function(x){return {storeID: stores[i + 1], query: x};}));
                    stores_ids_prices.push({storeName: stores[i], storeID: stores[i+1],
                                        total: totalPrice.toFixed(decimals), hasAll: hasAll});
                }       
             
                var  totalComp = function(a, b)
                {
                    return parseFloat(a.total) - parseFloat(b.total);
                }
            
                stores_ids_prices = stores_ids_prices.filter(function(x){return x.hasAll;}).sort(totalComp).concat(
                    stores_ids_prices.filter(function(x){return !x.hasAll;}).sort(totalComp));

                res.render( 'itemsSearch', {
                    initiallySelected: stores_ids_prices[0].storeID,
                    groceries: foodList,
                    missingGroceries: notAtStore,
                    storeList: stores_ids_prices,
                    valuePrepend: valuePrepend,
                    valueAppend: valueAppend,
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
                    valuePrepend: valuePrepend,
                    valueAppend: valueAppend,
                    cache: false
                });
    }
});

//takes a query, possibleTerms for a user to denote a quantity,
//as a single string seperated by "|", attribute name, and amount to multiply found numbers by
function sqlQuantityRequest(query, possibleTerms, attribute, mult)
{
    var sqlQuantity = "";
    
    var oz_range_re = new RegExp("(\\d+\\.?\\d*|\\d*\\.\\d+)(?:\\s)+(?:" + possibleTerms +
            ")\\s*-\\s*(\\d+\\.?\\d*|\\d*\\.\\d+)(?:\\s)+(?:" + possibleTerms + ")", "i");
    var oz_range_matches = oz_range_re.exec(query);
    if (oz_range_matches !== null)
    {
        query = query.replace(oz_range_re, "");
        
        var oz_min = oz_range_matches[1];
        var oz_max = oz_range_matches[2];
        sqlQuantity += "(" + oz_min * mult + " <= " + attribute + " AND  " + attribute + " <= " + oz_max * mult + ")";
    }
    else
    {
        var oz_re = new RegExp("(\\d+\\.?\\d*|\\d*\\.\\d+)(?:\\s)+(?:" + possibleTerms + ")", "i");
        var oz_matches = oz_re.exec(query);
        if (oz_matches !== null)
        {
            query = query.replace(oz_re, "");

            var oz = oz_matches[1];
            sqlQuantity += attribute + " = " + oz * mult;
        }
    }
    
    return {quantity: sqlQuantity, cleanedQuery: query};
}

http.createServer( app ).listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );
