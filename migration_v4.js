const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('Running migration to add selected_memory column...');

try {
    // Check if column exists
    const tableInfo = db.pragma('table_info(cart)');
    const hasMemory = tableInfo.some(col => col.name === 'selected_memory');

    if (!hasMemory) {
        db.exec('ALTER TABLE cart ADD COLUMN selected_memory TEXT');
        console.log('Added selected_memory column to cart table.');
    } else {
        console.log('selected_memory column already exists in cart table.');
    }

    console.log('Migration completed successfully!');
} catch (error) {
    console.error('Migration error:', error);
}

db.close();
