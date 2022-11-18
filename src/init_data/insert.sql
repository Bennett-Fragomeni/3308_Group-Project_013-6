INSERT INTO users (username, email, password) VALUES
('jandrich0', 'jandrich0@colorado.edu','$2b$10$qCFHfm/V20pAfO1o/.3BTOdUgm3V6LnzPDYMMRsLTgSbDheb1lzQu'),
('ghaslock1', 'ghaslock1@colorado.edu','$2b$10$yz.Fla0C54yprjMPX8H10.BBQPsJnspV5dhxlOtLeKTon0SqK9jVO'),
('edeetlefs2', 'edeetlefs2@colorado.edu','$2b$10$bOnQP9refZ6k3nje4Qgk6enZxsVuf/8fJl92Zo5P4Hr8vBDcpP1Ky'),
('tabbess3', 'tabbess3@colorado.edu','$2b$10$bkwCsKSbh4EVDXoykZNNvuXI.AEHTn48lEm.xsVisnywcajFcKLc6'),
('gcolter4', 'gcolter4@colorado.edu','$2b$10$wzLj0rc3J0jmRQn6fIhple1LiMEp8C4.0RNYXSetPO4B7ALaH6eHi');


INSERT INTO recipes (recipe_name, recipe_desc, recipe_img_url) VALUES
('Hamburger', 'An all american Hamburger, beef, bread, and all the toppings you could desire.','https://assets.epicurious.com/photos/57c5c6d9cf9e9ad43de2d96e/master/pass/the-ultimate-hamburger.jpg'),
('Hot dog', 'A classic hot dog on a bun, add ketchup if you want.','https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_1:1/k%2FEdit%2F2022-07-Hot-Dogs-In-The-Oven%2FHot_Dogs_in_Oven-4');


INSERT INTO ingredients (ingredient_name) VALUES
('ground chuck'),
('ground sirloin'),
('salt'),
('pepper'),
('american cheese'),
('iceberg lettuce'),
('tomato'),
('onion'),
('burger bun'),
('ketchup'),
('hot dog bun'),
('hot dog');

INSERT INTO units (unit_name) VALUES
('lb'),
('slice'),
('pinch'),
('teaspoon'),
('tablespoon'),
('cup'),
('');



INSERT INTO recipe_to_ingredients (recipe_id, ingredient_id, quantity, unit_id) VALUES
(1, 1, 0.5, 1),
(1, 2, 0.5, 1),
(1, 3, 1, 1),
(1, 4, 0.25, 4),
(1, 5, 1, 2),
(1, 6, 3, 2),
(1, 7, 2, 2),
(1, 8, 3, 2),
(1, 9, 1, 7),
(1, 10, 1, 5),
(2, 10, 1, 5),
(2, 11, 1, 7),
(2, 12, 1, 7);

INSERT INTO cart (user_id, recipe_id, quantity) VALUES
(1, 1, 1),
(1, 2, 1);

