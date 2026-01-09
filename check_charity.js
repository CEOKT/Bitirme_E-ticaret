const db = require('./database');

const charityProducts = db.prepare("SELECT id, name, donation_percent FROM products WHERE donation_percent = 100").all();

console.log(`\n📊 İyilik Ürünleri (donation_percent = 100):`);
console.log(`Toplam: ${charityProducts.length} adet\n`);

charityProducts.forEach((p, i) => {
    console.log(`${i + 1}. [ID: ${p.id}] ${p.name}`);
});

console.log('\n✓ Kontrol tamamlandı.');
