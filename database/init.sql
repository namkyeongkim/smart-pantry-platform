-- Users & Profiles
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dietary_flags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- e.g., 'Vegan', 'Gluten-Free', 'Nut-Allergy'
);

CREATE TABLE user_dietary_preferences (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dietary_flag_id INTEGER REFERENCES dietary_flags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, dietary_flag_id)
);

-- Ingredients & Pantry
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- e.g., 'Produce', 'Spices', 'Dairy'
    default_unit VARCHAR(20) -- e.g., 'grams', 'cups', 'units'
);

CREATE TABLE pantry_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ingredient_id)
);

-- Recipes
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    instructions TEXT,
    prep_time_minutes INTEGER,
    servings INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_ingredients (
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE recipe_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- e.g., 'Italian', 'Spicy', 'Quick'
);

CREATE TABLE recipe_categories (
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES recipe_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

-- Cooking History & Analytics
CREATE TABLE cooking_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_id VARCHAR(50),         -- Spoonacular API recipe ID
    recipe_title VARCHAR(200),     -- Recipe name for display
    cooked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);