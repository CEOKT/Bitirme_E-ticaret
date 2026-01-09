const db = require('./database');

console.log('Seeding impact data...');

try {
    // Product 1: Kadın Yazlık Elbise (LÖSEV)
    db.prepare(`UPDATE products SET 
        impact_title = 'LÖSEV ile Umut Olun',
        impact_description = '* Lösemili çocukların tedavi masraflarını karşılar\n* Ailelerine maddi ve manevi destek sağlar\n* Sağlıklı beslenme paketleri ulaştırır'
        WHERE name LIKE '%Elbise%'`).run();

    // Product 2: Kampanya Ürünü (Bağış Kampanyası)
    db.prepare(`UPDATE products SET 
        impact_title = 'Eğitim Seferberliğine Katkı',
        impact_description = 'Bu ürünün tüm geliri doğrudan öğrencilerin eğitim ihtiyaçlarına aktarılır.\nHer satın alım bir öğrencinin 1 aylık kırtasiye masrafını karşılar.'
        WHERE donation_percent = 100`).run();

    // Product 3: Erkek Deri Mont
    db.prepare(`UPDATE products SET 
        impact_title = 'Doğayı Koruyun',
        impact_description = 'TEMA Vakfı aracılığıyla 5 adet fidan dikimi gerçekleştirilir.\nGelecek nesillere daha yeşil bir dünya bırakılır.'
        WHERE name LIKE '%Mont%'`).run();

    console.log('Seeding completed!');
} catch (error) {
    console.error('Seeding failed:', error);
}
