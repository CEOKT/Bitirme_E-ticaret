const Database = require('better-sqlite3');
const path = require('path');

// Veritabanı dosyasının yolu
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: null }); // verbose: console.log ile her sorguyu basar, kapalı

console.log('📦 Veritabanı Bağlantısı Başarılı: ' + dbPath);
console.log('--------------------------------------------------');

// 1. Tabloları Listele
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

console.log(`📂 Toplam ${tables.length} tablo bulundu:\n`);
if (tables.length === 0) {
    console.log("Tablo bulunamadı.");
    process.exit(0);
}

// Her tablo için özet bilgi göster
tables.forEach((table, index) => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
    console.log(`${index + 1}. ${table.name} (${count} kayıt)`);
});

console.log('\n--------------------------------------------------');
console.log('🔎 ÖNEMLİ TABLOLARDAN ÖRNEK VERİLER (İLK 5 KAYIT)');
console.log('--------------------------------------------------');

const tablesToShow = ['users', 'products', 'campaigns', 'orders', 'variants'];

tablesToShow.forEach(tableName => {
    // Tablo var mı kontrol et
    const tableExists = tables.find(t => t.name === tableName);
    if (!tableExists) return;

    console.log(`\n📋 TABLO: ${tableName.toUpperCase()}`);
    const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();

    if (rows.length > 0) {
        console.table(rows);
    } else {
        console.log("   (Veri yok)");
    }
});

console.log('\n--------------------------------------------------');
console.log('✅ Veritabanı görüntüleme tamamlandı.');
