const db = require('./database');

try {
    const variants = db.prepare('SELECT product_id, type, value FROM product_variants').all();
    console.log('All Variants:');
    variants.forEach(v => console.log(`Prod ${v.product_id}: ${v.type} - ${v.value}`));
} catch (error) {
    console.error('Error:', error);
}
