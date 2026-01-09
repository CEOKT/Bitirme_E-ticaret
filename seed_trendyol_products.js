const db = require('./database.js');

console.log('Starting Trendyol Charity Products seeding...');

// Scraped Data from Trendyol (Pet Shop - Charity Products)
const trendyolProducts = [
    {
        "brand": "Petshop",
        "name": "Trendline Kuzu Etli Yetişkin Köpek Maması 15 Kg",
        "price": "1.168 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1448/product/media/images/prod/QC/20240730/02/3b5d6c0a-d7dd-30fc-9005-b8883684e2f4/1_org_zoom.jpg"
    },
    {
        "brand": "Hill's",
        "name": "Somonlu Kısırlaştırılmış Yetişkin Kedi Maması 8 2 Kg Hediyeli",
        "price": "4.087,63 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1786/prod/QC_ENRICHMENT/20251106/06/52282317-0afc-3e2f-9baa-fed3a938dd40/1_org_zoom.jpg"
    },
    {
        "brand": "Pro Nutrition",
        "name": "Prestige Adult Skin Somonlu Yetişkin Köpek Maması 12 Kg",
        "price": "4.300 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1625/prod/QC/20250112/20/8046675d-25dc-3f9a-a9d5-948b9bbb3f7c/1_org_zoom.jpg"
    },
    {
        "brand": "Royal Canin",
        "name": "Veterinary Gastrointestinal Köpek Kuru Maması 2 Kg",
        "price": "1.499 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1610/prod/QC/20241204/01/3856f3c8-0dcf-3d88-b488-f98dcda19428/1_org_zoom.jpg"
    },
    {
        "brand": "MM Petshop",
        "name": "Chedy Super Premıum Kısırlaştırılmış Balıklı Yetişkin Kedi Maması 10 Kg",
        "price": "1.550 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty603/product/media/images/20221119/14/218249494/627375322/1/1_org_zoom.jpg"
    },
    {
        "brand": "Acana",
        "name": "Heritage Adult Small Breed Köpek Maması 6 Kg",
        "price": "5.983 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1595/prod/QC/20241030/02/ef23a5f0-4263-3421-a76d-750109acffb9/1_org_zoom.jpg"
    },
    {
        "brand": "Petshop",
        "name": "Trendline Puppy Beef Rice Yavru Köpek Maması 15 Kg",
        "price": "1.149 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1446/product/media/images/prod/QC/20240730/02/d51f2a4c-6284-3e8a-83b1-77139cead8df/1_org_zoom.jpg"
    },
    {
        "brand": "Proline",
        "name": "Adult Balıklı Yetişkin Kedi Maması 1.2 Kg",
        "price": "247,89 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1498/product/media/images/prod/QC/20240823/09/985c11b1-ff15-3431-93ba-6484d03824c5/1_org_zoom.jpg"
    },
    {
        "brand": "MBV",
        "name": "Cat Notopac Kedi Tüy Yumağı Önleyici Macun 50 gr",
        "price": "329 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1028/product/media/images/prod/SPM/PIM/20231028/21/65a481e1-8db4-3b2f-921d-1bc8342213d8/1_org_zoom.jpg"
    },
    {
        "brand": "Neva Petshop",
        "name": "PROPLAN STERİLİSED SOMON 10 KG",
        "price": "3.899,99 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1515/product/media/images/prod/QC/20240901/00/81a35805-ef90-3b47-9a08-0a2b07b94a0a/1_org_zoom.jpg"
    },
    {
        "brand": "Prestige",
        "name": "Puppy Maxi Büyük Irk Yavru Köpek Maması 3 Kg",
        "price": "900 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1586/prod/QC/20241014/17/8f6ee582-9ec4-3a0f-91d9-8195cb6fa166/1_org_zoom.jpg"
    },
    {
        "brand": "Advance",
        "name": "Adult Mini Tavuklu Küçük Irk Yetişkin Köpek Maması 3 Kg",
        "price": "1.169 TL",
        "image": "https://cdn.dsmcdn.com/mnresize/400/-/ty1787/prod/QC_ENRICHMENT/20251107/04/0871e99d-1c0d-30e0-a2b1-0b4fc6a62d7c/1_org_zoom.jpg"
    }
];

// Helper to clean price string to number
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    // Remove " TL", spaces, and dots (thousand separator)
    // Replace comma with dot (decimal separator)
    // Example: "4.087,63 TL" -> "4087.63"
    let clean = priceStr.replace(' TL', '').replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

// Find or Create "Pet Ürünleri" Category
let mainCat = db.prepare("SELECT id FROM main_categories WHERE slug = 'ev-yasam'").get();
let subCat = db.prepare("SELECT id FROM sub_categories WHERE slug = 'mutfak' OR slug = 'ev-tekstili'").get(); // Fallback subcat

// Find Animal STK
let stk = db.prepare("SELECT user_id, organization_name FROM stk_applications WHERE organization_type LIKE '%Hayvan%' OR organization_name LIKE '%Hayvan%' LIMIT 1").get();

// Fallback STK if not found
if (!stk) {
    stk = db.prepare("SELECT user_id, organization_name FROM stk_applications LIMIT 1").get();
}

console.log(`Using STK: ${stk ? stk.organization_name : 'None'}`);

// DELETE OLD CHARITY PRODUCTS
// donation_percent = 100 olan ürünleri (İyilik Ürünlerini) temizle
try {
    const deleteResult = db.prepare("DELETE FROM products WHERE donation_percent = 100").run();
    console.log(`Deleted ${deleteResult.changes} old charity products.`);
} catch (err) {
    console.error("Error deleting old products:", err.message);
}

const insertProduct = db.prepare(`
    INSERT INTO products (name, price, old_price, image, description, main_category_id, sub_category_id, brand, stock, rating, donation_percent, donation_org, stk_id, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Insert Products
trendyolProducts.forEach(p => {
    const price = parsePrice(p.price);
    const oldPrice = Math.round(price * 1.2); // Fake old price

    try {
        insertProduct.run(
            p.name,
            price,
            oldPrice,
            p.image,
            `${p.brand} marka bu ürün, sokak hayvanlarına destek olmak amacıyla satışa sunulmuştur. Gelirin %100'ü bağışlanacaktır.`,
            mainCat ? mainCat.id : 5, // Default to Ev-Yaşam
            subCat ? subCat.id : 6, // Default to subcat
            p.brand,
            50, // Stock
            5, // Rating
            100, // %100 Donation (Charity Product)
            stk ? stk.organization_name : 'STK Hayvan Dostları',
            stk ? stk.user_id : null,
            0 // Not featured on home slider maybe?
        );
        console.log(`✓ Added: ${p.name} - ${price} TL`);
    } catch (err) {
        console.error(`✗ Error adding ${p.name}:`, err.message);
    }
});

console.log('Trendyol seeding completed!');
