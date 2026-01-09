const db = require('./database');

const product = db.prepare('SELECT id, name, impact_title, impact_description FROM products WHERE id = 1').get();
console.log('Product 1 Impact Data:', product);
