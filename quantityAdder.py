import sqlite3
import re
import string

#if needed, adds the columns oz, fl_oz, and count
def addColumns(c):
    c.execute("ALTER TABLE product ADD COLUMN oz NUMERIC(14, 7)");
    c.execute("ALTER TABLE product ADD COLUMN fl_oz NUMERIC(14, 7)");
    c.execute("ALTER TABLE product ADD COLUMN count INT");

#takes conversion and list of (names, num) and returns (names, num * conversion)
def convert_units(items, conversion):
    return map(lambda x: (x[0], float(x[1]) * conversion), items);
    
def updateTable(items, column):
    for x in items:
        #name = x[0].replace("'", "\\'");
        #print name
        print x[0];
        sql = "Update product Set " + column + "=" + str(x[1]) + " WHERE product_name=\"" + x[0] + "\"";
        c.execute(sql);
    
conn = sqlite3.connect('groceries.sqlite')
conn.text_factory = str;

c = conn.cursor()

addColumns(c);

c.execute("SELECT * FROM product WHERE fl_oz IS NOT NULL");
for i in range(20):
    print c.fetchone();

c.execute("SELECT product_name FROM product");
names = c.fetchall();

#create regexs to find units of mass
oz_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*(oz|ounce)(?i)");
lb_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*(lb|pound)(?i)");

#get items that have a unit of mass
oz_items = [(x[0], oz_re.search(x[0]).group(1)) for x in names if oz_re.search(x[0])];
lb_items = [(x[0], lb_re.search(x[0]).group(1)) for x in names if lb_re.search(x[0])];

oz_from_lb_items = convert_units(lb_items, 16);

mass_items = list(set(oz_items + oz_from_lb_items));

#create regexs to find units of volume
fl_oz_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*(fl.?\s?oz|fluid\s?ounces)(?i)");
qt_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*(qt|quart)(?i)");
gal_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*(gallon|gal)(?i)");
ml_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*ml(?i)");
l_re = re.compile("((\d+\\.?\d*|\d*\\.\d+))(\s|-)*l(?i)");

#get items that have unit of volume
fl_oz_items = [(x[0], fl_oz_re.search(x[0]).group(1)) for x in names if fl_oz_re.search(x[0])];
qt_items = [(x[0], qt_re.search(x[0]).group(1)) for x in names if qt_re.search(x[0])];
gal_items = [(x[0], gal_re.search(x[0]).group(1)) for x in names if gal_re.search(x[0])];
ml_items = [(x[0], ml_re.search(x[0]).group(1)) for x in names if ml_re.search(x[0])];
l_items = [(x[0], l_re.search(x[0]).group(1)) for x in names if l_re.search(x[0])];

fl_oz_from_qt_items = convert_units(qt_items, 32);
fl_oz_from_gal_items = convert_units(gal_items, 128);
fl_oz_from_ml_items = convert_units(ml_items, .033814);
fl_oz_from_l_items = convert_units(l_items, 33.814);

volume_items = list(set(fl_oz_items + fl_oz_from_qt_items
                        + fl_oz_from_gal_items + fl_oz_from_ml_items
                        + fl_oz_from_l_items));

#create regexs to find count/pack etc
count_re = re.compile("(\d+)(\s|-)*(/\s*box|count|ct|pack|pk|pc|bags|bag|pieces|piece|bars|sticks)(?i)");
pack_of_re = re.compile("(pack|case|box|set) of (\d+)(?i)");

#get items that have count/pack etc
count_items = [(x[0], int(count_re.search(x[0]).group(1))) for x in names if count_re.search(x[0])];
pack_of_items = [(x[0], int(pack_of_re.search(x[0]).group(2))) for x in names if pack_of_re.search(x[0])];

numbered_items = list(set(count_items + pack_of_items));

print "HERE";

updateTable(mass_items, "oz");

print "updated oz";

updateTable(volume_items, "fl_oz");

print "updated fl_oz";


updateTable(numbered_items, "count");

print "update count";

conn.commit();

#print oz_items[0:5];
#print lb_items[0:5];
#print qt_items[0:5];
#print fl_oz_items[0:5];
#print gal_items[0:5];
#print ml_items[0:5];
#print l_items[0:5];
#print count_items[0:5];
#print pack_of_items[0:5];

#print len(mass_items);
#print len(volume_items);
#print len(numbered_items);

notCaught = [x for x in names if not oz_re.search(x[0]) and not lb_re.search(x[0]) \
                and not qt_re.search(x[0]) \
                and not fl_oz_re.search(x[0]) and not gal_re.search(x[0]) \
                and not ml_re.search(x[0]) and not l_re.search(x[0]) \
                and not count_re.search(x[0]) and not pack_of_re.search(x[0])]
                
#print notCaught;
print len(notCaught);

conn.close();