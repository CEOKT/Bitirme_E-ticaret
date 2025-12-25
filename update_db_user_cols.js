const db = require('./database');

try {
    console.log('Adding user_id to addresses...');
    // Check if column exists first to avoid error? Better-sqlite3 throws if duplicate column usually.
    // simpler to try/catch
    try {
        db.prepare('ALTER TABLE addresses ADD COLUMN user_id INTEGER').run();
        console.log('Added user_id to addresses.');
    } catch (e) {
        console.log('user_id probably exists in addresses:', e.message);
    }

    console.log('Adding user_id to payment_cards...');
    try {
        db.prepare('ALTER TABLE payment_cards ADD COLUMN user_id INTEGER').run();
        console.log('Added user_id to payment_cards.');
    } catch (e) {
        console.log('user_id probably exists in payment_cards:', e.message);
    }

    console.log('Database schema update complete.');
} catch (error) {
    console.error('Migration failed:', error);
}
