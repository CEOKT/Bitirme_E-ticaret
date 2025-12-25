const db = require('./database');

console.log('Running Migration v10: Adding card_number column to payment_cards...');

try {
    // Check if column exists
    const tableInfo = db.pragma('table_info(payment_cards)');
    const hasColumn = tableInfo.some(col => col.name === 'card_number');

    if (!hasColumn) {
        // Add card_number column
        db.prepare('ALTER TABLE payment_cards ADD COLUMN card_number TEXT').run();
        console.log('✅ Added card_number column to payment_cards');
    } else {
        console.log('ℹ️ Column card_number already exists');
    }

    console.log('Migration v10 completed successfully!');

} catch (error) {
    console.error('❌ Migration failed:', error.message);
}
