const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('--- Debugging Campaign Data ---');

// 1. Check Category
const cat = db.prepare("SELECT * FROM main_categories WHERE slug = 'bagis-kampanyasi'").get();
console.log('Category:', cat);

// 2. Check Products in that Category
if (cat) {
    const products = db.prepare("SELECT id, name, price FROM products WHERE main_category_id = ?").all(cat.id);
    console.log(`Found ${products.length} products in category '${cat.name}'`);
    products.forEach(p => console.log(` - [${p.id}] ${p.name}`));
} else {
    console.log('Category NOT FOUND!');
}

// 3. Check Products with STK ID
const stkProducts = db.prepare("SELECT id, name, stk_id FROM products WHERE stk_id IS NOT NULL").all();
console.log(`Found ${stkProducts.length} products linked to STKs`);
stkProducts.forEach(p => console.log(` - [${p.id}] ${p.name} (STK: ${p.stk_id})`));
