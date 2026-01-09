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
        role TEXT DEFAULT 'user', -- 'user', 'stk', 'admin'
        status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
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
        stk_id INTEGER, -- Link to STK if this is a campaign product
        impact_title TEXT,
        impact_description TEXT,
        is_featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id),
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id),
        FOREIGN KEY (stk_id) REFERENCES users(id)
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

    -- STK Details table
    CREATE TABLE IF NOT EXISTS stk_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        organization_name TEXT NOT NULL,
        certificate_path TEXT,
        description TEXT,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- STK Applications table
    CREATE TABLE IF NOT EXISTS stk_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        organization_name TEXT NOT NULL,
        organization_type TEXT,
        activity_area TEXT,
        description TEXT,
        certificate_path TEXT,
        status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Campaigns table
    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stk_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0,
        image TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stk_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

// Migration: Add role/status columns if they don't exist (for existing DBs)
try {
    db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
} catch (e) { /* Column likely exists */ }

try {
    db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved'").run();
} catch (e) { /* Column likely exists */ }

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

// Migration: Add stk_id to products if not exists
try {
    db.prepare("ALTER TABLE products ADD COLUMN stk_id INTEGER REFERENCES users(id)").run();
} catch (e) { /* Column likely exists */ }

// Migration: Add impact details to products
try {
    db.prepare("ALTER TABLE products ADD COLUMN impact_title TEXT").run();
    db.prepare("ALTER TABLE products ADD COLUMN impact_description TEXT").run();
} catch (e) { /* Columns likely exist */ }

// Insert "Bağış Kampanyası" Main Category if not exists
const campaignCat = db.prepare("SELECT id FROM main_categories WHERE slug = 'bagis-kampanyasi'").get();
if (!campaignCat) {
    db.prepare("INSERT INTO main_categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(
        'Bağış Kampanyası', 'bagis-kampanyasi', 'fa-hand-holding-heart', 'STK Bağış Kampanyası Ürünleri', 99
    );
    console.log('Bağış Kampanyası category created.');
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
// Check if products exist
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();

if (productCount.count === 0) {
    console.log('No products found. Please run "node seed_full_products.js" to populate test data.');
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
