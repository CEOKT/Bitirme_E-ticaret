const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('--- Table Info: payment_cards ---');
const columns = db.prepare('PRAGMA table_info(payment_cards)').all();
console.log(JSON.stringify(columns, null, 2));

try {
    console.log('--- Attempting Test Insert ---');
    const stmt = db.prepare(`
        INSERT INTO payment_cards (user_id, card_name, card_number_masked, expiry_date, card_type)
        VALUES (?, ?, ?, ?, ?)
    `);
    // Attempt to insert a dummy record for user_id: 1
    const res = stmt.run(1, 'DEBUG CARD', '**** 1111', '12/99', 'visa');
    console.log('Insert SUCCESS! Record ID:', res.lastInsertRowid);

    // Clean up
    db.prepare('DELETE FROM payment_cards WHERE id = ?').run(res.lastInsertRowid);
    console.log('Test record deleted.');
} catch (e) {
    console.error('Insert FAILED:', e.message);
    if (e.message.includes('user_id')) {
        console.log('\nDIAGNOSIS: The user_id column is MISSING. The migration did not run successfully.');
    } else if (e.message.includes('NOT NULL')) {
        console.log('\nDIAGNOSIS: A NOT NULL constraint was violated.');
    }
}
