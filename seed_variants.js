const db = require('./database');

try {
    const lastProduct = db.prepare('SELECT id, name FROM products ORDER BY id DESC LIMIT 1').get();
    if (lastProduct) {
        console.log(`Seeding size for ${lastProduct.name} (${lastProduct.id})`);
        db.prepare('INSERT INTO product_variants (product_id, type, value, stock) VALUES (?, ?, ?, ?)').run(lastProduct.id, 'size', 'Standart', 100);
        db.prepare('INSERT INTO product_variants (product_id, type, value, stock) VALUES (?, ?, ?, ?)').run(lastProduct.id, 'memory', '128GB', 100);
        console.log('Done.');
    }
} catch (error) {
    console.error('Error:', error);
}
