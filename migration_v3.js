const db = require('./database');

console.log('Starting Migration V3...');

try {
    // Add selected_memory to cart
    try {
        db.prepare('ALTER TABLE cart ADD COLUMN selected_memory TEXT').run();
        console.log('Added selected_memory to cart');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('selected_memory already exists in cart');
        } else {
            console.error('Error adding column to cart:', e.message);
        }
    }

    // Add selected_memory to order_items
    try {
        db.prepare('ALTER TABLE order_items ADD COLUMN selected_memory TEXT').run();
        console.log('Added selected_memory to order_items');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('selected_memory already exists in order_items');
        } else {
            console.error('Error adding column to order_items:', e.message);
        }
    }

    console.log('Migration V3 completed successfully.');

} catch (error) {
    console.error('Migration failed:', error);
}
