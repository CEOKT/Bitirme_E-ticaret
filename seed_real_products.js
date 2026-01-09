const db = require('./database');

console.log('20 Varyantlı Ürün Ekleniyor...');

function getCategoryId(slug) {
    const cat = db.prepare('SELECT id FROM main_categories WHERE slug = ?').get(slug);
    return cat ? cat.id : 1; // Default to 1 if not found
}

// Subcategory helper (Updated for unique slugs)
function getSubCategoryId(mainId, name) {
    // Check if exists under this main category
    let sub = db.prepare('SELECT id FROM sub_categories WHERE main_category_id = ? AND name = ?').get(mainId, name);
    if (sub) return sub.id;

    const baseSlug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    let uniqueSlug = `${baseSlug}-${mainId}`;

    // Check if slug exists globally
    const slugCheck = db.prepare('SELECT id FROM sub_categories WHERE slug = ?').get(uniqueSlug);
    if (slugCheck) return slugCheck.id; // Should logically belong to this category based on our naming convention, or collision handled

    try {
        const info = db.prepare('INSERT INTO sub_categories (main_category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)').run(mainId, name, uniqueSlug, 1);
        return info.lastInsertRowid;
    } catch (e) {
        console.log(`Subcat creation skipped/failed for ${name}: ${e.message}`);
        // Fallback: try to find ANY subcat with this name
        const anySub = db.prepare('SELECT id FROM sub_categories WHERE name = ?').get(name);
        if (anySub) return anySub.id;
        return 1; // Last resort
    }
}

const products = [
    // --- KADIN (Giyim) ---
    {
        name: 'Oversize Pamuklu T-Shirt',
        price: 349.90,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        catSlug: 'kadin',
        subCat: 'T-Shirt',
        variants: [
            { sku: 'TS-W-001', attributes: { Renk: 'Beyaz', Beden: 'S' }, price: 349.90, stock: 50 },
            { sku: 'TS-W-002', attributes: { Renk: 'Beyaz', Beden: 'M' }, price: 349.90, stock: 50 },
            { sku: 'TS-W-003', attributes: { Renk: 'Siyah', Beden: 'S' }, price: 349.90, stock: 50 },
            { sku: 'TS-W-004', attributes: { Renk: 'Siyah', Beden: 'M' }, price: 349.90, stock: 50 }
        ]
    },
    {
        name: 'Yüksek Bel Jean Pantolon',
        price: 899.90,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
        catSlug: 'kadin',
        subCat: 'Pantolon',
        variants: [
            { sku: 'JN-W-001', attributes: { Renk: 'Mavi', Beden: '36' }, price: 899.90, stock: 30 },
            { sku: 'JN-W-002', attributes: { Renk: 'Mavi', Beden: '38' }, price: 899.90, stock: 30 },
            { sku: 'JN-W-003', attributes: { Renk: 'Siyah', Beden: '36' }, price: 899.90, stock: 30 }
        ]
    },
    {
        name: 'Çiçek Desenli Yazlık Elbise',
        price: 659.90,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500',
        catSlug: 'kadin',
        subCat: 'Elbise',
        variants: [
            { sku: 'DR-W-001', attributes: { Renk: 'Kırmızı', Beden: 'S' }, price: 659.90, stock: 20 },
            { sku: 'DR-W-002', attributes: { Renk: 'Mavi', Beden: 'M' }, price: 659.90, stock: 20 }
        ]
    },
    {
        name: 'Basic Kapüşonlu Sweatshirt',
        price: 549.90,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
        catSlug: 'kadin',
        subCat: 'Sweatshirt',
        variants: [
            { sku: 'SW-W-001', attributes: { Renk: 'Gri', Beden: 'M' }, price: 549.90, stock: 40 },
            { sku: 'SW-W-002', attributes: { Renk: 'Pembe', Beden: 'S' }, price: 549.90, stock: 40 }
        ]
    },
    {
        name: 'Deri Görünümlü Ceket',
        price: 1299.90,
        image: 'https://images.unsplash.com/photo-1551028919-ac7d214f2e28?w=500',
        catSlug: 'kadin',
        subCat: 'Ceket',
        variants: [
            { sku: 'JK-W-001', attributes: { Renk: 'Siyah', Beden: 'M' }, price: 1299.90, stock: 15 },
            { sku: 'JK-W-002', attributes: { Renk: 'Kahve', Beden: 'M' }, price: 1299.90, stock: 15 }
        ]
    },

    // --- ERKEK (Giyim) ---
    {
        name: 'Slim Fit Gömlek',
        price: 499.90,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
        catSlug: 'erkek',
        subCat: 'Gömlek',
        variants: [
            { sku: 'SR-M-001', attributes: { Renk: 'Beyaz', Beden: 'M' }, price: 499.90, stock: 40 },
            { sku: 'SR-M-002', attributes: { Renk: 'Mavi', Beden: 'L' }, price: 499.90, stock: 40 }
        ]
    },
    {
        name: 'Kargo Pantolon',
        price: 749.90,
        image: 'https://images.unsplash.com/photo-1517445312882-1dd5dcca6435?w=500',
        catSlug: 'erkek',
        subCat: 'Pantolon',
        variants: [
            { sku: 'CP-M-001', attributes: { Renk: 'Haki', Beden: '32' }, price: 749.90, stock: 35 },
            { sku: 'CP-M-002', attributes: { Renk: 'Siyah', Beden: '34' }, price: 749.90, stock: 35 }
        ]
    },
    {
        name: 'Polo Yaka T-Shirt',
        price: 399.90,
        image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500',
        catSlug: 'erkek',
        subCat: 'T-Shirt',
        variants: [
            { sku: 'PL-M-001', attributes: { Renk: 'Lacivert', Beden: 'M' }, price: 399.90, stock: 60 },
            { sku: 'PL-M-002', attributes: { Renk: 'Beyaz', Beden: 'L' }, price: 399.90, stock: 60 }
        ]
    },
    {
        name: 'Spor Şort',
        price: 299.90,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500',
        catSlug: 'erkek',
        subCat: 'Şort',
        variants: [
            { sku: 'SH-M-001', attributes: { Renk: 'Siyah', Beden: 'M' }, price: 299.90, stock: 50 },
            { sku: 'SH-M-002', attributes: { Renk: 'Gri', Beden: 'L' }, price: 299.90, stock: 50 }
        ]
    },
    {
        name: 'Deri Kemer',
        price: 199.90,
        image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500',
        catSlug: 'erkek',
        subCat: 'Aksesuar',
        variants: [
            { sku: 'BT-M-001', attributes: { Renk: 'Kahve', Beden: 'Standart' }, price: 199.90, stock: 80 }
        ]
    },

    // --- ELEKTRONİK ---
    {
        name: 'Akıllı Telefon X12',
        price: 24999.00,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        catSlug: 'elektronik',
        subCat: 'Telefon',
        variants: [
            { sku: 'PH-001', attributes: { Renk: 'Siyah', Hafıza: '128GB' }, price: 24999.00, stock: 10 },
            { sku: 'PH-002', attributes: { Renk: 'Beyaz', Hafıza: '256GB' }, price: 27999.00, stock: 10 }
        ]
    },
    {
        name: 'Kablosuz Kulaklık Pro',
        price: 3499.00,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        catSlug: 'elektronik',
        subCat: 'Kulaklık',
        variants: [
            { sku: 'HP-001', attributes: { Renk: 'Siyah', Model: 'Pro' }, price: 3499.00, stock: 25 },
            { sku: 'HP-002', attributes: { Renk: 'Beyaz', Model: 'Lite' }, price: 2499.00, stock: 25 }
        ]
    },
    {
        name: 'Akıllı Saat Series 5',
        price: 5999.00,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        catSlug: 'elektronik',
        subCat: 'Saat',
        variants: [
            { sku: 'WT-001', attributes: { Renk: 'Siyah', Kayış: 'Silikon' }, price: 5999.00, stock: 20 },
            { sku: 'WT-002', attributes: { Renk: 'Gümüş', Kayış: 'Metal' }, price: 6499.00, stock: 20 }
        ]
    },
    {
        name: 'Laptop Backpack',
        price: 899.00,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        catSlug: 'elektronik',
        subCat: 'Çanta',
        variants: [
            { sku: 'BP-001', attributes: { Renk: 'Gri', Boyut: '15.6 inç' }, price: 899.00, stock: 40 }
        ]
    },
    {
        name: 'Bluetooth Speaker',
        price: 1299.00,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        catSlug: 'elektronik',
        subCat: 'Ses',
        variants: [
            { sku: 'SP-001', attributes: { Renk: 'Siyah' }, price: 1299.00, stock: 30 },
            { sku: 'SP-002', attributes: { Renk: 'Mavi' }, price: 1299.00, stock: 30 }
        ]
    },

    // --- EV & YAŞAM ---
    {
        name: 'Çift Kişilik Nevresim Takımı',
        price: 799.90,
        image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=500',
        catSlug: 'ev-yasam',
        subCat: 'Tekstil',
        variants: [
            { sku: 'BD-001', attributes: { Desen: 'Çiçekli', Boyut: 'Çift' }, price: 799.90, stock: 25 },
            { sku: 'BD-002', attributes: { Desen: 'Geometrik', Boyut: 'Çift' }, price: 799.90, stock: 25 }
        ]
    },
    {
        name: 'Seramik Vazo Seti',
        price: 459.90,
        image: 'https://images.unsplash.com/photo-1581783342308-f792ca18df14?w=500',
        catSlug: 'ev-yasam',
        subCat: 'Dekorasyon',
        variants: [
            { sku: 'VS-001', attributes: { Renk: 'Beyaz' }, price: 459.90, stock: 30 }
        ]
    },
    {
        name: 'Bambu Banyo Seti',
        price: 349.90,
        image: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=500',
        catSlug: 'ev-yasam',
        subCat: 'Banyo',
        variants: [
            { sku: 'BTH-001', attributes: { Parça: '5li Set' }, price: 349.90, stock: 40 }
        ]
    },
    {
        name: 'Masa Lambası',
        price: 599.90,
        image: 'https://images.unsplash.com/photo-1507473888900-52e1ad145928?w=500',
        catSlug: 'ev-yasam',
        subCat: 'Aydınlatma',
        variants: [
            { sku: 'LMP-001', attributes: { Renk: 'Siyah', Işık: 'Sarı' }, price: 599.90, stock: 35 },
            { sku: 'LMP-002', attributes: { Renk: 'Beyaz', Işık: 'Beyaz' }, price: 599.90, stock: 35 }
        ]
    },
    {
        name: 'Dekoratif Yastık Kılıfı',
        price: 129.90,
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500',
        catSlug: 'ev-yasam',
        subCat: 'Tekstil',
        variants: [
            { sku: 'PLW-001', attributes: { Renk: 'Hardal', Boyut: '45x45' }, price: 129.90, stock: 100 },
            { sku: 'PLW-002', attributes: { Renk: 'Gri', Boyut: '45x45' }, price: 129.90, stock: 100 }
        ]
    }
];

try {
    const insertProduct = db.prepare(`
        INSERT INTO products (name, price, image, main_category_id, sub_category_id, brand, stock, donation_percent, donation_org)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVariant = db.prepare(`
        INSERT INTO variants (product_id, sku, attributes, price, stock, image)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Check if duplicate SKUs exist and delete them to avoid UNIQUE constraint error
    const skuList = products.flatMap(p => p.variants.map(v => v.sku));
    if (skuList.length > 0) {
        db.prepare(`DELETE FROM variants WHERE sku IN (${skuList.map(() => '?').join(',')})`).run(...skuList);
        console.log('Skipping duplicate deletion for brevity, transaction will rollback on error anyway');
    }

    db.transaction(() => {
        for (const p of products) {
            const mainId = getCategoryId(p.catSlug);
            const subId = getSubCategoryId(mainId, p.subCat);

            const result = insertProduct.run(p.name, p.price, p.image, mainId, subId, 'Destifo Collection', 100, 15, 'TEGV');
            const productId = result.lastInsertRowid;
            console.log(`Ürün Eklendi: ${p.name} (ID: ${productId})`);

            for (const v of p.variants) {
                // Check if SKU exists (extra safety inside transaction)
                const existingSku = db.prepare('SELECT id FROM variants WHERE sku = ?').get(v.sku);
                if (!existingSku) {
                    insertVariant.run(productId, v.sku, JSON.stringify(v.attributes), v.price, v.stock, v.image || p.image);
                    console.log(`  - Varyant: ${v.sku} - ${JSON.stringify(v.attributes)}`);
                } else {
                    console.log(`  - Skipping existing SKU: ${v.sku}`);
                }
            }
        }
    })();

    console.log('20 Ürün İşlemi Tamamlandı.');

} catch (error) {
    console.error('Hata:', error.message);
    if (error.message.includes('UNIQUE')) {
        console.log('Hint: Data might be partially inserted or rolled back. Try resetting DB if persistent.');
    }
}
