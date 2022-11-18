DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
    user_id SERIAL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(200),
    password CHAR(60) NOT NULL,
    CONSTRAINT userPK PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS recipes CASCADE;
CREATE TABLE recipes(
    recipe_id SERIAL PRIMARY KEY,
    recipe_name VARCHAR(50) NOT NULL,
    recipe_desc VARCHAR(500) NOT NULL,
    recipe_img_url VARCHAR(250)
);

DROP TABLE IF EXISTS ingredients CASCADE;
CREATE TABLE ingredients(
    ingredient_id SERIAL PRIMARY KEY,
    ingredient_name VARCHAR(50) NOT NULL
);

DROP TABLE IF EXISTS recipe_to_ingredients CASCADE;
CREATE TABLE recipe_to_ingredients(
    recipe_id SERIAL NOT NULL,
    ingredient_id SERIAL NOT NULL,
    quantity FLOAT NOT NULL,
    unit_id SERIAL NOT NULL
);

DROP TABLE IF EXISTS units CASCADE;
CREATE TABLE units(
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(50) NOT NULL
);

DROP TABLE IF EXISTS cart CASCADE;
CREATE TABLE cart(
    user_id SERIAL NOT NULL,
    recipe_id SERIAL NOT NULL,
    quantity INT NOT NULL
);