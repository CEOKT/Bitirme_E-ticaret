const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('Migrating database schema (v8)...');

try {
    // Add detailed address columns to addresses table
    const columns = [
        { name: 'neighborhood', type: 'TEXT' },
        { name: 'street', type: 'TEXT' },
        { name: 'building_no', type: 'TEXT' },
        { name: 'apartment_no', type: 'TEXT' }
    ];

    columns.forEach(col => {
        try {
            db.prepare(`ALTER TABLE addresses ADD COLUMN ${col.name} ${col.type}`).run();
            console.log(`Added ${col.name} column to addresses table.`);
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log(`${col.name} column already exists.`);
            } else {
                console.error(`Error adding ${col.name}:`, e.message);
            }
        }
    });

    console.log('Migration v8 completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
}
