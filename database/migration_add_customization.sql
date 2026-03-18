-- Migration to add customization support to order items
ALTER TABLE order_items ADD COLUMN customization TEXT;
