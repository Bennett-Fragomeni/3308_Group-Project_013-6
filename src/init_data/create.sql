DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    /* user_id PRIMARY KEY*/
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL
    );