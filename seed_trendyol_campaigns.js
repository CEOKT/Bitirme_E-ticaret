// Script to seed Trendyol scraped products as campaign products
const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

// First, find or create the campaign category in main_categories
let campaignCategory = db.prepare("SELECT id FROM main_categories WHERE slug = 'bagis-kampanyasi' OR name LIKE '%Bağış%'").get();

if (!campaignCategory) {
    const result = db.prepare("INSERT INTO main_categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(
        'Bağış Kampanyası',
        'bagis-kampanyasi',
        'fa-hand-holding-heart',
        'Hayvan dostlarımız için bağış kampanyaları',
        99
    );
    campaignCategory = { id: result.lastInsertRowid };
    console.log('Created campaign category with ID:', campaignCategory.id);
} else {
    console.log('Using existing campaign category ID:', campaignCategory.id);
}

// Scraped products from Trendyol - Pet supplies for donation campaigns
const scrapedProducts = [
    {
        name: "Şarjlı Havlama Önleyici Köpek Tasması",
        brand: "Hopdiye",
        price: 1540,
        image: "https://cdn.dsmcdn.com/ty1481/product/media/images/prod/QC/20240809/01/f9e8a786-8964-325d-9da4-c6899166f318/1_org.jpg",
        description: "Sokak köpekleri için havlama önleyici tasma. Barınaklardaki dostlarımız için ideal."
    },
    {
        name: "Kedi Tüy Dökümü Önleyici Multivitamin Damla",
        brand: "Muvicado",
        price: 269.99,
        image: "https://cdn.dsmcdn.com/ty1476/product/media/images/prod/QC/20240806/14/d67e657a-063a-3f41-b8ca-8263721345d9/1_org.jpg",
        description: "Barınaklardaki kediler için tüy sağlığı desteği. Her alım bir can için umut."
    },
    {
        name: "Havlama Önleyici Köpek Tasması (Elektrik Şoksuz)",
        brand: "Hopdiye",
        price: 1180,
        image: "https://cdn.dsmcdn.com/ty1020/product/media/images/prod/PIM/20231023/16/32c66863-711e-450f-bcbc-9e5c6b65576a/1_org.jpg",
        description: "Güvenli ve şok içermeyen tasma. Sokak köpekleri için ideal çözüm."
    },
    {
        name: "35 Parça Kedi Başlangıç Seti",
        brand: "Chitto",
        price: 2197,
        image: "https://cdn.dsmcdn.com/ty1025/product/media/images/prod/PIM/20231028/15/853e5e40-0588-4f8e-b57f-f13ced1ca13c/1_org.jpg",
        description: "Yeni sahiplendirilen kediler için komple başlangıç seti. Mama kabı, oyuncak ve daha fazlası."
    },
    {
        name: "Kedi Köpek İç Dış Anti Parazit Bitkisel Set",
        brand: "Muvicado",
        price: 549.99,
        image: "https://cdn.dsmcdn.com/ty1500/product/media/images/prod/QC/20240822/11/4a974b62-1082-3536-a367-93ae34608c0f/1_org.jpg",
        description: "Barınak hayvanları için parazit koruma seti. Doğal ve güvenli formül."
    },
    {
        name: "Sterilised Somonlu Kısırlaştırılmış Kedi Maması 3 Kg",
        brand: "Pro Plan",
        price: 1202.65,
        image: "https://cdn.dsmcdn.com/ty1081/product/media/images/prod/PIM/20231208/13/44498361-b44c-473d-9d95-8857d9760773/1_org.jpg",
        description: "Kısırlaştırılmış kediler için premium mama. Barınak kedilerine kaliteli beslenme."
    },
    {
        name: "Hazneli Kedi Kum Küreği - Pratik Temizlik",
        brand: "Chittoshop",
        price: 145,
        image: "https://cdn.dsmcdn.com/ty1611/product/media/images/prod/QC/20241219/12/375b4869-2fb0-3e28-a46a-7227ae851b47/1_org.jpg",
        description: "Barınaklar için pratik temizlik aracı. Her alımda bir barınağa destek."
    },
    {
        name: "Catnipli Yenilebilir Kedi Nanesi Oyuncağı",
        brand: "GOBYPET",
        price: 23.99,
        image: "https://cdn.dsmcdn.com/ty1341/product/media/images/prod/QC/20240603/17/8cb7d4f3-2db7-30e7-ac6e-010f3c05167b/1_org.jpg",
        description: "Barınak kedileri için eğlenceli oyuncak. Mutlu patiler için küçük bir katkı."
    }
];

// Delete existing campaign products to avoid duplicates
db.prepare("DELETE FROM products WHERE main_category_id = ?").run(campaignCategory.id);
console.log('Cleared existing campaign products');

// Insert scraped products
const insertStmt = db.prepare(`
    INSERT INTO products (name, price, image, description, main_category_id, brand, stock, donation_percent, donation_org, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

scrapedProducts.forEach((product, index) => {
    insertStmt.run(
        product.brand + ' ' + product.name,
        product.price,
        product.image,
        product.description,
        campaignCategory.id,
        product.brand,
        100,
        100, // 100% donation for campaigns
        'Hayvan Barınakları Derneği',
        1 // is_featured
    );
    console.log(`✓ Added: ${product.name} - ${product.price} TL`);
});

console.log(`\n✅ Successfully added ${scrapedProducts.length} campaign products from Trendyol!`);
console.log('Campaign category ID:', campaignCategory.id);

db.close();
