const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('Migrating database schema (v9)...');

try {
    // Add user_id column to payment_cards if not exists
    try {
        db.prepare('ALTER TABLE payment_cards ADD COLUMN user_id INTEGER').run();
        console.log('Added user_id column to payment_cards table.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('user_id column already exists in payment_cards.');
        } else {
            console.error('Error adding user_id to payment_cards:', e.message);
        }
    }

    // Add is_default column to payment_cards if not exists
    try {
        db.prepare('ALTER TABLE payment_cards ADD COLUMN is_default INTEGER DEFAULT 0').run();
        console.log('Added is_default column to payment_cards table.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('is_default column already exists in payment_cards.');
        } else {
            console.error('Error adding is_default to payment_cards:', e.message);
        }
    }

    console.log('Migration v9 completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
}
