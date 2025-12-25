const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('Migrating database schema (v6)...');

try {
    // Add variant_id column to order_items
    try {
        db.prepare('ALTER TABLE order_items ADD COLUMN variant_id INTEGER').run();
        console.log('Added variant_id column to order_items table.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('variant_id column already exists.');
        } else {
            console.error('Error adding variant_id:', e);
        }
    }

    // Add variant_info column to order_items (stores JSON string of variant details)
    try {
        db.prepare('ALTER TABLE order_items ADD COLUMN variant_info TEXT').run();
        console.log('Added variant_info column to order_items table.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('variant_info column already exists.');
        } else {
            console.error('Error adding variant_info:', e);
        }
    }

    console.log('Migration v6 completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
}
