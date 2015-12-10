# grocery_db_app

CREATE TABLE user_(
  user_ID INTEGER PRIMARY KEY ASC ,
  username varchar(256),
  password varchar(256),
  email varchar(254) unique);
CREATE TABLE user_query_history(
  query_ID INTEGER PRIMARY KEY ASC,
  user_ID int,
  query varchar(256),
  food_type_name varchar(100),
  foreign key (user_ID) references user_,
  foreign key (food_type_name) references food_type);
CREATE TABLE shopping_list(
  list_ID INTEGER PRIMARY KEY ASC,
  user_ID int,
  created_date date,
  foreign key (user_ID) references user_);
CREATE TABLE list_items(
  list_ID int,
  product_name varchar(100),
  primary key (list_ID, product_name),
  foreign key (product_name) references product,
  foreign key (list_ID) references shopping_list);
