const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('database.sqlite');

try {
    console.log('Checking database schema...');

    // Create product_features table
    db.exec(`
        CREATE TABLE IF NOT EXISTS product_features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            feature_name TEXT NOT NULL,
            feature_value TEXT NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `);
    console.log('Table product_features created or already exists.');

    // Check if we need to insert sample features
    const count = db.prepare('SELECT COUNT(*) as count FROM product_features').get();

    if (count.count === 0) {
        console.log('Populating product features...');

        const insertFeature = db.prepare('INSERT INTO product_features (product_id, feature_name, feature_value) VALUES (?, ?, ?)');
        const products = db.prepare('SELECT id, main_category_id FROM products').all();

        products.forEach(p => {
            // General features for all
            insertFeature.run(p.id, 'Stok Durumu', 'Stokta Var');
            insertFeature.run(p.id, 'Kargo', 'Ücretsiz Kargo');

            // Category specific
            if (p.main_category_id === 1) { // Kadın
                insertFeature.run(p.id, 'Kumaş', '%100 Pamuk');
                insertFeature.run(p.id, 'Desen', 'Düz');
            } else if (p.main_category_id === 6) { // Elektronik
                insertFeature.run(p.id, 'Garanti', '2 Yıl');
                insertFeature.run(p.id, 'Marka', 'Orijinal');
            }
        });
        console.log('Sample features inserted.');
    } else {
        console.log('Product features already populated.');
    }

    console.log('Database repair completed successfully.');

} catch (error) {
    console.error('Error repairing database:', error);
} finally {
    db.close();
}
