const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const cat = db.prepare("SELECT id FROM main_categories WHERE slug = 'bagis-kampanyasi'").get();

if (cat) {
    console.log('Inserting sample campaign products...');

    // Check if we already have products
    const existing = db.prepare("SELECT COUNT(*) as count FROM products WHERE main_category_id = ?").get(cat.id);

    if (existing.count === 0) {
        const insert = db.prepare(`
            INSERT INTO products (name, price, image, description, main_category_id, stock, donation_percent, brand, donation_org)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run(
            'Acil Kışlık Bot Yardımı',
            750,
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            'Köy okullarındaki çocuklar için bot yardımı.',
            cat.id,
            1000,
            100,
            'Köy Okulları Derneği',
            'Köy Okulları Derneği'
        );

        insert.run(
            'Sokak Hayvanları İçin Mama',
            300,
            'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500',
            'Barınaklar için 15kg kuru mama desteği.',
            cat.id,
            1000,
            100,
            'HAYTAP',
            'HAYTAP'
        );

        insert.run(
            'Eğitim Bursu Desteği',
            500,
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500',
            'Üniversite öğrencileri için aylık burs desteği.',
            cat.id,
            1000,
            100,
            'TEV',
            'TEV'
        );
        insert.run(
            'Fidan Bağışı',
            100,
            'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5afa?w=500',
            'Geleceğe nefes olmak için bir fidan bağışlayın.',
            cat.id,
            10000,
            100,
            'TEMA',
            'TEMA'
        );

        console.log('Sample campaigns inserted!');
    } else {
        console.log('Campaigns already exist.');
    }
} else {
    console.error('Category not found!');
}
