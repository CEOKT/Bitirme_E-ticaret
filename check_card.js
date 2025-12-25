const db = require('better-sqlite3')('database.sqlite');
const card = db.prepare('SELECT * FROM payment_cards WHERE id = 17').get();
console.log(card);
