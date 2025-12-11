const db = require('./database');

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name));

    if (tables.find(t => t.name === 'orders')) {
        const orderColumns = db.prepare("PRAGMA table_info(orders)").all();
        console.log('Orders columns:', orderColumns.map(c => c.name));
    } else {
        console.error('Orders table missing!');
    }

    if (tables.find(t => t.name === 'order_items')) {
        const itemColumns = db.prepare("PRAGMA table_info(order_items)").all();
        console.log('OrderItems columns:', itemColumns.map(c => c.name));
    } else {
        console.error('OrderItems table missing!');
    }

} catch (err) {
    console.error('Error:', err);
}
