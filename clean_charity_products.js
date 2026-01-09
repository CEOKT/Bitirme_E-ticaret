const db = require('./database');

console.log('İyilik Ürünleri (Donation Products) temizliği başlatılıyor...');

try {
    // 1. Mevcut İyilik Ürünlerini Listele
    const charityProducts = db.prepare("SELECT id, name FROM products WHERE donation_percent = 100").all();
    console.log(`Toplam ${charityProducts.length} adet İyilik Ürünü bulundu.`);

    let deletedCount = 0;
    const keywords = ['mama', 'yem', 'food', 'kedi', 'köpek', 'pet']; // İzin verilen kelimeler

    charityProducts.forEach(p => {
        const nameLower = p.name.toLowerCase();
        const isFood = keywords.some(k => nameLower.includes(k));

        if (!isFood) {
            console.log(`SİLİNİYOR (Mama değil): [${p.id}] ${p.name}`);
            db.prepare("DELETE FROM products WHERE id = ?").run(p.id);
            deletedCount++;
        } else {
            // console.log(`KALIYOR (Mama): [${p.id}] ${p.name}`);
        }
    });

    console.log(`------------------------------------------------`);
    console.log(`Temizlik Tamamlandı.`);
    console.log(`Silinen Ürün Sayısı: ${deletedCount}`);
    console.log(`Kalan Mama Sayısı: ${charityProducts.length - deletedCount}`);
    console.log(`------------------------------------------------`);

} catch (error) {
    console.error('Hata:', error.message);
}
