-- Database Initialization for Pantry App PoC

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    dietary_profile JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS pantry_inventory (
    item_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    ingredient_name VARCHAR(100) NOT NULL,
    quantity NUMERIC DEFAULT 0,
    unit VARCHAR(20)
);

-- 2. Seed Data
-- Clear existing data to avoid duplicates during testing
TRUNCATE pantry_inventory, users RESTART IDENTITY CASCADE;

-- Insert a Test User
INSERT INTO users (username, dietary_profile) 
VALUES ('TestUser', '{"lifestyle": "vegan"}');

-- Insert Initial Pantry Items (Missing "Avocado" for the "Chicken & Rice Bowl")
-- We have Rice, Beans, Tomato, Chicken (wait, user is vegan but serves chicken? purely for test logic)
INSERT INTO pantry_inventory (user_id, ingredient_name, quantity, unit)
VALUES 
    (1, 'Rice', 1000, 'grams'),
    (1, 'Black Beans', 2, 'cans'),
    (1, 'Tomato', 3, 'whole'),
    (1, 'Salsa', 1, 'jar');
