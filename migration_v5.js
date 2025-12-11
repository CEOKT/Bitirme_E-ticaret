const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('Running migration v5: Add variants table...');

try {
    // Check if variants table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='variants'").get();

    if (!tableExists) {
        db.exec(`
            CREATE TABLE variants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                sku TEXT UNIQUE,
                attributes TEXT NOT NULL,
                price REAL NOT NULL,
                stock INTEGER DEFAULT 0,
                image TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('Created variants table.');
    } else {
        console.log('variants table already exists.');
    }

    console.log('Migration v5 completed successfully!');
} catch (error) {
    console.error('Migration error:', error);
}

db.close();
