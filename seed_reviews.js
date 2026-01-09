const db = require('./database');

console.log('Seeding reviews...');

try {
    // Delete existing reviews for test products
    db.prepare('DELETE FROM reviews WHERE product_id IN (1, 2)').run();

    // Add multiple reviews for Product 1 (Elbise)
    db.prepare(`INSERT INTO reviews (product_id, user_name, rating, comment, helpful_count) VALUES 
        (1, 'Test Kullanıcısı 1', 5, 'Bu sadece elbise için özel bir yorumdur.', 10),
        (1, 'Ayşe', 5, 'Çok güzel bayıldım', 5),
        (1, 'Fatma', 4, 'Beden biraz dar', 2),
        (1, 'Mehmet', 5, 'Hızlı kargo', 8),
        (1, 'Ali', 3, 'Kumaşı beklediğim gibi değil', 1)`).run();

    console.log('Review seeding completed!');
} catch (error) {
    console.error('Seeding failed:', error);
}
