const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('Migrating database schema (v7)...');

try {
    // 1. Create donations table if not exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_id INTEGER,
            amount REAL,
            organization TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );
    `);
    console.log('Created donations table.');

    // 2. Add iyzico_payment_id column to orders table
    try {
        db.prepare('ALTER TABLE orders ADD COLUMN iyzico_payment_id TEXT').run();
        console.log('Added iyzico_payment_id column to orders table.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('iyzico_payment_id column already exists.');
        } else {
            console.error('Error adding iyzico_payment_id:', e);
        }
    }

    console.log('Migration v7 completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
}
