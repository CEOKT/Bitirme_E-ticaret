const db = require('./database');

console.log('Seeding features...');

try {
    // Clear existing features for Product 1
    db.prepare('DELETE FROM product_features WHERE product_id = 1').run();

    // Add features for Product 1 (Elbise)
    const insertFeature = db.prepare('INSERT INTO product_features (product_id, feature_name, feature_value) VALUES (?, ?, ?)');

    insertFeature.run(1, 'Kumaş', '%100 Pamuk');
    insertFeature.run(1, 'Kalıp', 'Regular Fit');
    insertFeature.run(1, 'Yaka', 'V Yaka');
    insertFeature.run(1, 'Kol Tipi', 'Kısa Kol');
    insertFeature.run(1, 'Desen', 'Çiçekli');
    insertFeature.run(1, 'Mevsim', 'Yaz');

    console.log('Feature seeding completed!');
} catch (error) {
    console.error('Seeding failed:', error);
}
