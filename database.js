const Database = require('better-sqlite3');
const path = require('path');

// Create database
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        is_blocked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admins table
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Main Categories table
    CREATE TABLE IF NOT EXISTS main_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT,
        description TEXT,
        sort_order INTEGER DEFAULT 0
    );

    -- Sub Categories table
    CREATE TABLE IF NOT EXISTS sub_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE CASCADE
    );

    -- Brands table
    CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        logo TEXT,
        description TEXT,
        is_featured INTEGER DEFAULT 0
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        old_price REAL,
        image TEXT NOT NULL,
        description TEXT,
        main_category_id INTEGER NOT NULL,
        sub_category_id INTEGER,
        brand TEXT NOT NULL,
        stock INTEGER DEFAULT 100,
        rating INTEGER DEFAULT 0,
        donation_percent INTEGER DEFAULT 15,
        donation_org TEXT DEFAULT 'LÖSEV',
        is_featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id),
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
    );

    -- Product Features table
    CREATE TABLE IF NOT EXISTS product_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        feature_name TEXT NOT NULL,
        feature_value TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Product Variants table (Colors and Sizes - Legacy)
    CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'color' or 'size'
        value TEXT NOT NULL,
        stock INTEGER DEFAULT 10,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- SKU-Based Variants table (New - Combination-based)
    CREATE TABLE IF NOT EXISTS variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        sku TEXT UNIQUE,
        attributes TEXT NOT NULL, -- JSON: {"renk":"Siyah","hafıza":"128GB"}
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        image TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Cart table
    CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        selected_color TEXT,
        selected_size TEXT,
        selected_memory TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Favorites table
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(session_id, product_id)
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        total_amount TEXT NOT NULL,
        donation_amount TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order items table
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price TEXT NOT NULL,
        selected_color TEXT,
        selected_size TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Reviews table
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        helpful_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Addresses table
    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        title TEXT NOT NULL,
        full_address TEXT NOT NULL,
        district TEXT,
        city TEXT,
        postal_code TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Payment Cards table
    CREATE TABLE IF NOT EXISTS payment_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        card_name TEXT NOT NULL,
        card_number_masked TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        card_type TEXT DEFAULT 'visa',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

`);

// Insert default admin if not exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (adminCount.count === 0) {
    db.prepare('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)').run('admin', 'admin123', 'Sistem Yöneticisi', 'superadmin');
    console.log('Default admin created: admin / admin123');
}

// Insert main categories
const mainCatCount = db.prepare('SELECT COUNT(*) as count FROM main_categories').get();
if (mainCatCount.count === 0) {
    const insertMainCat = db.prepare('INSERT INTO main_categories (id, name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)');

    insertMainCat.run(1, 'Kadın', 'kadin', 'fa-venus', 'Kadın giyim, ayakkabı ve aksesuar', 1);
    insertMainCat.run(2, 'Erkek', 'erkek', 'fa-mars', 'Erkek giyim, ayakkabı ve aksesuar', 2);
    insertMainCat.run(3, 'Çocuk', 'cocuk', 'fa-child', 'Çocuk giyim ve oyuncak', 3);
    insertMainCat.run(4, 'Kozmetik', 'kozmetik', 'fa-spray-can-sparkles', 'Makyaj, cilt bakımı ve parfüm', 4);
    insertMainCat.run(5, 'Ev & Yaşam', 'ev-yasam', 'fa-home', 'Ev dekorasyonu ve yaşam ürünleri', 5);
    insertMainCat.run(6, 'Elektronik', 'elektronik', 'fa-laptop', 'Telefon, bilgisayar ve elektronik', 6);

    console.log('Main categories inserted!');
}

// Insert sub categories
const subCatCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories').get();
if (subCatCount.count === 0) {
    const insertSubCat = db.prepare('INSERT INTO sub_categories (main_category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)');

    // Kadın subcategories (main_category_id = 1)
    insertSubCat.run(1, 'Elbise', 'kadin-elbise', 1);
    insertSubCat.run(1, 'Ayakkabı', 'kadin-ayakkabi', 2);
    insertSubCat.run(1, 'Çanta', 'kadin-canta', 3);
    insertSubCat.run(1, 'Aksesuar', 'kadin-aksesuar', 4);
    insertSubCat.run(1, 'Spor', 'kadin-spor', 5);
    insertSubCat.run(1, 'Tişört', 'kadin-tisort', 6);
    insertSubCat.run(1, 'Pantolon', 'kadin-pantolon', 7);
    insertSubCat.run(1, 'Gömlek', 'kadin-gomlek', 8);

    // Erkek subcategories (main_category_id = 2)
    insertSubCat.run(2, 'Gömlek', 'erkek-gomlek', 1);
    insertSubCat.run(2, 'Tişört', 'erkek-tisort', 2);
    insertSubCat.run(2, 'Ayakkabı', 'erkek-ayakkabi', 3);
    insertSubCat.run(2, 'Mont', 'erkek-mont', 4);
    insertSubCat.run(2, 'Aksesuar', 'erkek-aksesuar', 5);
    insertSubCat.run(2, 'Pantolon', 'erkek-pantolon', 6);
    insertSubCat.run(2, 'Spor', 'erkek-spor', 7);

    // Çocuk subcategories (main_category_id = 3)
    insertSubCat.run(3, 'Kız Çocuk', 'kiz-cocuk', 1);
    insertSubCat.run(3, 'Erkek Çocuk', 'erkek-cocuk', 2);
    insertSubCat.run(3, 'Bebek', 'bebek', 3);
    insertSubCat.run(3, 'Oyuncak', 'oyuncak', 4);
    insertSubCat.run(3, 'Ayakkabı', 'cocuk-ayakkabi', 5);

    // Kozmetik subcategories (main_category_id = 4)
    insertSubCat.run(4, 'Makyaj', 'makyaj', 1);
    insertSubCat.run(4, 'Cilt Bakımı', 'cilt-bakimi', 2);
    insertSubCat.run(4, 'Saç Bakımı', 'sac-bakimi', 3);
    insertSubCat.run(4, 'Parfüm', 'parfum', 4);
    insertSubCat.run(4, 'Kişisel Bakım', 'kisisel-bakim', 5);

    // Ev & Yaşam subcategories (main_category_id = 5)
    insertSubCat.run(5, 'Mobilya', 'mobilya', 1);
    insertSubCat.run(5, 'Dekorasyon', 'dekorasyon', 2);
    insertSubCat.run(5, 'Aydınlatma', 'aydinlatma', 3);
    insertSubCat.run(5, 'Mutfak', 'mutfak', 4);
    insertSubCat.run(5, 'Banyo', 'banyo', 5);
    insertSubCat.run(5, 'Ev Tekstili', 'ev-tekstili', 6);

    // Elektronik subcategories (main_category_id = 6)
    insertSubCat.run(6, 'Telefon', 'telefon', 1);
    insertSubCat.run(6, 'Bilgisayar', 'bilgisayar', 2);
    insertSubCat.run(6, 'Tablet', 'tablet', 3);
    insertSubCat.run(6, 'Kulaklık', 'kulaklik', 4);
    insertSubCat.run(6, 'Akıllı Saat', 'akilli-saat', 5);
    insertSubCat.run(6, 'Kamera', 'kamera', 6);

    console.log('Sub categories inserted!');
}

// Check if products exist
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();

if (productCount.count === 0) {
    const insertProduct = db.prepare(`
        INSERT INTO products (name, price, old_price, image, description, main_category_id, sub_category_id, brand, stock, rating, donation_percent, donation_org, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Get subcategory IDs
    const getSubCatId = db.prepare('SELECT id FROM sub_categories WHERE slug = ?');

    // KADIN ÜRÜNLER
    insertProduct.run('Kadın Yazlık Elbise', 599, 799, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', 'Şık ve rahat yazlık elbise', 1, getSubCatId.get('kadin-elbise')?.id, 'Zara', 25, 124, 15, 'LÖSEV', 1);
    insertProduct.run('Kadın Topuklu Ayakkabı', 899, 1199, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500', 'Klasik topuklu ayakkabı', 1, getSubCatId.get('kadin-ayakkabi')?.id, 'Aldo', 18, 89, 12, 'TEGV', 1);
    insertProduct.run('Kadın Deri Çanta', 1299, 1599, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', 'Gerçek deri el çantası', 1, getSubCatId.get('kadin-canta')?.id, 'Michael Kors', 12, 156, 10, 'LÖSEV', 1);
    insertProduct.run('Kadın Altın Kolye', 499, null, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500', 'Altın kaplama kolye', 1, getSubCatId.get('kadin-aksesuar')?.id, 'Swarovski', 30, 67, 15, 'Kadın Dayanışma', 0);
    insertProduct.run('Kadın Spor Ayakkabı', 799, null, 'https://images.unsplash.com/photo-1589182373726-c7a63b52a2f9?w=500', 'Rahat spor ayakkabı', 1, getSubCatId.get('kadin-spor')?.id, 'Nike', 22, 210, 10, 'TEMA', 1);
    insertProduct.run('Kadın Basic Tişört', 199, 299, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', '%100 pamuk tişört', 1, getSubCatId.get('kadin-tisort')?.id, 'Koton', 50, 180, 12, 'LÖSEV', 0);

    // ERKEK ÜRÜNLER
    insertProduct.run('Erkek Slim Fit Gömlek', 449, 599, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 'Slim fit erkek gömleği', 2, getSubCatId.get('erkek-gomlek')?.id, 'Tommy Hilfiger', 35, 134, 10, 'LÖSEV', 1);
    insertProduct.run('Erkek Polo Tişört', 399, 499, 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500', 'Polo yaka tişört', 2, getSubCatId.get('erkek-tisort')?.id, 'Lacoste', 40, 98, 12, 'TEGV', 1);
    insertProduct.run('Erkek Deri Ayakkabı', 1499, 1899, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500', 'Gerçek deri klasik ayakkabı', 2, getSubCatId.get('erkek-ayakkabi')?.id, 'Hotiç', 15, 87, 8, 'LÖSEV', 1);
    insertProduct.run('Erkek Deri Mont', 2499, 2999, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', 'Gerçek deri ceket', 2, getSubCatId.get('erkek-mont')?.id, 'Derimod', 10, 67, 8, 'LÖSEV', 1);
    insertProduct.run('Erkek Kol Saati', 1299, null, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'Su geçirmez kol saati', 2, getSubCatId.get('erkek-aksesuar')?.id, 'Casio', 25, 234, 10, 'LÖSEV', 1);

    // ÇOCUK ÜRÜNLER
    insertProduct.run('Kız Çocuk Elbise', 299, 399, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500', 'Renkli çocuk elbisesi', 3, getSubCatId.get('kiz-cocuk')?.id, 'LC Waikiki', 45, 156, 20, 'LÖSEV', 1);
    insertProduct.run('Erkek Çocuk Tişört Seti', 249, 349, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500', '3lü tişört seti', 3, getSubCatId.get('erkek-cocuk')?.id, 'DeFacto', 60, 234, 18, 'TEGV', 1);
    insertProduct.run('Bebek Tulumu', 199, null, 'https://images.unsplash.com/photo-1522771930-78848d7c9d50?w=500', 'Yumuşak pamuklu tulum', 3, getSubCatId.get('bebek')?.id, 'Carters', 30, 89, 20, 'LÖSEV', 0);
    insertProduct.run('Çocuk Spor Ayakkabı', 399, 499, 'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=500', 'Hafif spor ayakkabı', 3, getSubCatId.get('cocuk-ayakkabi')?.id, 'Adidas', 28, 178, 15, 'TEGV', 1);

    // KOZMETİK
    insertProduct.run('Ruj Seti', 299, null, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500', '5li mat ruj seti', 4, getSubCatId.get('makyaj')?.id, 'MAC', 40, 423, 12, 'Kadın Dayanışma', 1);
    insertProduct.run('Nemlendirici Krem', 349, 449, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', 'Hyaluronik asit içerikli', 4, getSubCatId.get('cilt-bakimi')?.id, 'Loreal', 55, 567, 15, 'Kadın Dayanışma', 1);
    insertProduct.run('Saç Bakım Seti', 499, 649, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500', 'Şampuan ve saç maskesi', 4, getSubCatId.get('sac-bakimi')?.id, 'Kerastase', 20, 145, 12, 'LÖSEV', 0);
    insertProduct.run('Erkek Parfümü', 899, 1199, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', 'Eau de Parfum 100ml', 4, getSubCatId.get('parfum')?.id, 'Dior', 18, 289, 10, 'Kadın Dayanışma', 1);

    // EV & YAŞAM
    insertProduct.run('Modern Koltuk', 8999, 11999, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', '3 kişilik modern koltuk', 5, getSubCatId.get('mobilya')?.id, 'Ikea', 5, 45, 5, 'ÇEKÜL', 1);
    insertProduct.run('Dekoratif Vazo', 299, 399, 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500', 'Seramik dekoratif vazo', 5, getSubCatId.get('dekorasyon')?.id, 'English Home', 40, 89, 18, 'ÇEKÜL', 0);
    insertProduct.run('Masa Lambası', 449, null, 'https://images.unsplash.com/photo-1507473888900-52e1ad14db3d?w=500', 'Ahşap gövdeli lamba', 5, getSubCatId.get('aydinlatma')?.id, 'Madame Coco', 22, 134, 15, 'ÇEKÜL', 1);
    insertProduct.run('Çelik Tencere Seti', 1499, 1999, 'https://images.unsplash.com/photo-1584990347449-a8e0e50c3d8e?w=500', '8 parça çelik set', 5, getSubCatId.get('mutfak')?.id, 'Korkmaz', 15, 267, 10, 'LÖSEV', 1);

    // ELEKTRONİK
    insertProduct.run('Akıllı Telefon', 24999, 27999, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', '128GB, 5G destekli', 6, getSubCatId.get('telefon')?.id, 'Samsung', 20, 456, 5, 'TEGV', 1);
    insertProduct.run('Laptop', 34999, 39999, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'i7 işlemci, 16GB RAM', 6, getSubCatId.get('bilgisayar')?.id, 'Apple', 8, 312, 5, 'Darüşşafaka', 1);
    insertProduct.run('Kablosuz Kulaklık', 1299, 1599, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Aktif gürültü engelleme', 6, getSubCatId.get('kulaklik')?.id, 'Sony', 35, 567, 8, 'LÖSEV', 1);
    insertProduct.run('Akıllı Saat', 2999, 3499, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'GPS ve kalp ritmi ölçümü', 6, getSubCatId.get('akilli-saat')?.id, 'Apple', 25, 398, 8, 'TEGV', 1);

    console.log('Products inserted!');
}

// Check if brands exist
const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get();
if (brandCount.count === 0) {
    const insertBrand = db.prepare('INSERT INTO brands (name, slug, is_featured) VALUES (?, ?, ?)');

    insertBrand.run('Nike', 'nike', 1);
    insertBrand.run('Adidas', 'adidas', 1);
    insertBrand.run('Zara', 'zara', 1);
    insertBrand.run('H&M', 'hm', 1);
    insertBrand.run('Tommy Hilfiger', 'tommy-hilfiger', 1);
    insertBrand.run('Apple', 'apple', 1);
    insertBrand.run('Samsung', 'samsung', 1);
    insertBrand.run('Sony', 'sony', 1);
    insertBrand.run('Koton', 'koton', 1);
    insertBrand.run('LC Waikiki', 'lc-waikiki', 1);

    console.log('Brands inserted!');
}

console.log('Database initialized successfully!');

module.exports = db;
