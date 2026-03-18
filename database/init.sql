-- Cafe Next.js Database Schema and Sample Data
-- This is a basic setup for development purposes

-- Drop tables if they exist to allow re-running the script
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (supports local auth + Google OAuth)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable: Google auth users won't have a password
    email VARCHAR(255),
    display_name VARCHAR(100),
    google_id VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(20) DEFAULT 'local', -- 'local' or 'google'
    role VARCHAR(20) DEFAULT 'client', -- 'admin' or 'client'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (for menu categorization)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Menu items table
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, ready, completed, cancelled
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, failed, refunded
    payment_session_id VARCHAR(255), -- Stripe session ID (or simulated)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table (junction between orders and menu_items)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10, 2) NOT NULL, -- Price of the item when ordered
    customization TEXT -- Stores JSON string of options and special requests
);

-- ==========================================
-- Sample Data Insertion
-- ==========================================

-- Insert an admin user (password: 'admin123' - remember this is basic auth)
INSERT INTO users (username, password_hash, role, email, display_name, auth_provider) VALUES
    ('admin', 'admin123', 'admin', 'admin@cafe.com', 'Admin User', 'local'),
    ('client1', 'password', 'client', 'client1@example.com', 'Test Client', 'local');

-- Insert categories
INSERT INTO categories (name, description, sort_order) VALUES
    ('Coffee', 'Hot and cold caffeinated beverages', 1),
    ('Tea', 'Hot and iced herbal, green, and black teas', 2),
    ('Pastries', 'Freshly baked goods', 3),
    ('Sandwiches', 'Made-to-order sandwiches', 4);

-- Insert menu items
INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES
    (1, 'Espresso', 'A concentrated shot of coffee', 2.50, '/images/espresso.jpg'),
    (1, 'Latte', 'Espresso with steamed milk and a light layer of foam', 4.00, '/images/latte.jpg'),
    (1, 'Cappuccino', 'Equal parts espresso, steamed milk, and milk foam', 4.00, '/images/cappuccino.jpg'),
    
    (2, 'Green Tea', 'Classic sencha green tea', 3.00, '/images/green-tea.jpg'),
    (2, 'Chai Latte', 'Spiced black tea blended with steamed milk', 4.50, '/images/chai.jpg'),
    
    (3, 'Croissant', 'Buttery, flaky French pastry', 3.50, '/images/croissant.jpg'),
    (3, 'Blueberry Muffin', 'Classic muffin loaded with blueberries', 3.00, '/images/muffin.jpg'),
    
    (4, 'Turkey Club', 'Turkey, bacon, lettuce, tomato, and mayo on toasted sourdough', 8.50, '/images/turkey-club.jpg'),
    (4, 'Caprese Panini', 'Fresh mozzarella, tomatoes, and basil pesto on ciabatta', 7.50, '/images/caprese.jpg');
