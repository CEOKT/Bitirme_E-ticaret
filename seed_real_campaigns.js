const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('Seeding real fundraising campaigns...');

try {
    // 1. Get Approved STKs
    const stks = db.prepare("SELECT id, first_name, last_name, email FROM users WHERE role = 'stk'").all();

    if (stks.length === 0) {
        console.error('No STKs found! Please run seed_full_products.js first.');
        process.exit(1);
    }

    console.log(`Found ${stks.length} STKs.`);

    // 2. Ensure Table Exists
    console.log('Ensuring campaigns table exists...');
    db.prepare(`
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
        )
    `).run();

    // 3. Clear existing campaigns
    console.log('Clearing existing campaigns...');
    db.prepare('DELETE FROM campaigns').run();
    try {
        db.prepare('DELETE FROM sqlite_sequence WHERE name="campaigns"').run();
    } catch (e) {
        console.log('sqlite_sequence clear ignored.');
    }

    // 4. Define Campaign Templates
    const campaignTemplates = [
        {
            title: 'Köy Okullarına Kışlık Bot Yardımı',
            desc: 'Doğu Anadolu\'daki 5 köy okulundaki 200 öğrenci için kışlık bot ve mont ihtiyacını karşılıyoruz.',
            image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
            target: 150000
        },
        {
            title: 'Sokak Hayvanları İçin Mama Desteği',
            desc: 'Barınaklardaki ve sokaklardaki dostlarımız için kış aylarında mama desteği sağlıyoruz.',
            image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
            target: 50000
        },
        {
            title: 'Geleceğin Mühendisleri Burs Fonu',
            desc: 'Maddi durumu yetersiz 50 mühendislik öğrencisinin 1 yıllık eğitim masraflarını üstleniyoruz.',
            image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
            target: 500000
        },
        {
            title: 'Hatıra Ormanı Fidan Bağışı',
            desc: 'Geleceğe nefes olmak için 10.000 fidan dikiyoruz. Doğayı birlikte yeşertelim.',
            image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5afa?w=800',
            target: 200000
        },
        {
            title: 'Temiz Su Kuyusu Projesi',
            desc: 'Suya erişimi olmayan bölgelerde temiz su kuyuları açarak hayata can veriyoruz.',
            image: 'https://images.unsplash.com/photo-1581242163695-19d0acde259e?w=800',
            target: 120000
        },
        {
            title: 'Minik Kalpler Ameliyat Fonu',
            desc: 'Acil ameliyat olması gereken ancak maddi imkanı olmayan çocuklarımızın tedavi masraflarını karşılıyoruz.',
            image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800',
            target: 350000
        }
    ];

    // 5. Insert Campaigns
    console.log('Inserting campaigns...');
    const insert = db.prepare(`
        INSERT INTO campaigns (stk_id, title, description, image, target_amount, current_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    campaignTemplates.forEach((tpl, index) => {
        // Assign to random STK
        const stk = stks[index % stks.length];

        // Random raised amount (between 10% and 90% of target)
        const raised = Math.floor(tpl.target * (0.1 + Math.random() * 0.8));

        insert.run(stk.id, tpl.title, tpl.desc, tpl.image, tpl.target, raised);
        console.log(`Created campaign "${tpl.title}" for ${stk.first_name || stk.email}`);
    });

    console.log('Campaign seeding completed successfully!');
} catch (error) {
    console.error('FATAL ERROR:', error);
    process.exit(1);
}
