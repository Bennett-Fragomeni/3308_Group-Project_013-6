DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password CHAR(60) NOT NULL
);

DROP TABLE IF EXISTS recipes CASCADE;
CREATE TABLE recipes(
    recipe_id SERIAL PRIMARY KEY,
    recipe_name VARCHAR(50) NOT NULL,
    recipe_desc VARCHAR(500) NOT NULL,
    recipe_img VARCHAR(100)
);

DROP TABLE IF EXISTS ingredients CASCADE;
CREATE TABLE ingredients(
    ingredient_id SERIAL PRIMARY KEY,
    ingredient_name VARCHAR(50) NOT NULL
);

DROP TABLE IF EXISTS recipe_to_ingredients CASCADE;
CREATE TABLE recipe_to_ingredients(
    recipe_id SERIAL NOT NULL,
    ingredient_id SERIAL NOT NULL
);