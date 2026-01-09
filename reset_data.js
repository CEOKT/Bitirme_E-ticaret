const db = require('./database');

console.log('Veritabanı temizliği başlatılıyor...');

try {
    // Foreign Key kontrolünü geçici olarak kapat
    db.pragma('foreign_keys = OFF');

    // 1. Siparişleri ve Sipariş Kalemlerini Sil
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    console.log('✓ Siparişler ve sipariş detayları silindi.');

    // 2. Kampanya Bağış Miktarlarını Sıfırla
    db.prepare('UPDATE campaigns SET current_amount = 0').run();
    console.log('✓ Kampanya bağış miktarları sıfırlandı.');

    // 3. Sepeti Temizle (Tablo adı 'cart')
    try {
        db.prepare('DELETE FROM cart').run();
        console.log('✓ Kullanıcı sepetleri (cart) temizlendi.');
    } catch (e) {
        console.log('Uyarı: cart tablosu silinemedi: ' + e.message);
    }

    // Varsa cart_items tablosunu da sil (bazen eski tablo kalıyor)
    try {
        db.prepare('DELETE FROM cart_items').run();
        console.log('✓ Kullanıcı sepetleri (cart_items) temizlendi.');
    } catch (e) {
        // Tablo yoksa sorun değil
    }

    // Foreign Key kontrolünü tekrar aç
    db.pragma('foreign_keys = ON');

    console.log('------------------------------------------------');
    console.log('TEMİZLİK TAMAMLANDI. Tüm veriler sıfırlandı.');
    console.log('------------------------------------------------');

} catch (error) {
    console.error('Hata oluştu:', error.message);
    console.error(error);
}
