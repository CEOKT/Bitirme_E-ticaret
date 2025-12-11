const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
    console.log('Starting Migration V2...');

    // 1. Create product_variants table
    db.exec(`
        CREATE TABLE IF NOT EXISTS product_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'color' or 'size'
            value TEXT NOT NULL,
            stock INTEGER DEFAULT 10,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `);
    console.log('Created product_variants table.');

    // 2. Add columns to cart table
    try {
        db.exec("ALTER TABLE cart ADD COLUMN selected_color TEXT");
        db.exec("ALTER TABLE cart ADD COLUMN selected_size TEXT");
        console.log('Added columns to cart table.');
    } catch (e) {
        console.log('Cart table columns might already exist:', e.message);
    }

    // 3. Add columns to order_items table
    try {
        db.exec("ALTER TABLE order_items ADD COLUMN selected_color TEXT");
        db.exec("ALTER TABLE order_items ADD COLUMN selected_size TEXT");
        console.log('Added columns to order_items table.');
    } catch (e) {
        console.log('Order Items table columns might already exist:', e.message);
    }

    // 4. Seed sample variants
    const variantCount = db.prepare('SELECT COUNT(*) as count FROM product_variants').get();

    if (variantCount.count === 0) {
        console.log('Seeding sample variants...');
        const insertVariant = db.prepare('INSERT INTO product_variants (product_id, type, value) VALUES (?, ?, ?)');

        // Get all products
        const products = db.prepare('SELECT id, main_category_id FROM products').all();

        products.forEach(p => {
            // Add sizes for Clothes (Category 1, 2, 3)
            if ([1, 2, 3].includes(p.main_category_id)) {
                ['S', 'M', 'L', 'XL'].forEach(size => insertVariant.run(p.id, 'size', size));
                ['Siyah', 'Beyaz', 'Mavi'].forEach(color => insertVariant.run(p.id, 'color', color));
            }
            // Add colors for Electronics (Category 6) - e.g. Phone colors
            else if (p.main_category_id === 6) {
                ['Siyah', 'Gümüş', 'Altın'].forEach(color => insertVariant.run(p.id, 'color', color));
            }
            // Add colors for Cosmetics (Category 4)
            else if (p.main_category_id === 4) {
                ['Standart'].forEach(color => insertVariant.run(p.id, 'size', color));
            }
        });
        console.log('Sample variants seeded.');
    }

    console.log('Migration V2 completed successfully.');

} catch (error) {
    console.error('Migration failed:', error);
} finally {
    db.close();
}
