const db = require('./database.js');

console.log('Starting full product seeding with unique products...');

// 1. Clear existing products and variants for a clean slate
console.log('Clearing old product data...');
try {
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM cart').run();
    db.prepare('DELETE FROM favorites').run();
    db.prepare('DELETE FROM product_features').run();
    db.prepare('DELETE FROM variants').run();
    db.prepare('DELETE FROM product_variants').run();
    db.prepare('DELETE FROM products').run();
} catch (e) {
    console.log('Cleanup error (might be empty):', e.message);
}

// ==========================================
// ENSURE STKs EXIST (Generic / Fictional)
// ==========================================

// Clean up existing STK users to ensure we only have the requested ones
console.log('Cleaning up old STK accounts...');
try {
    db.prepare('DELETE FROM stk_applications').run();
    db.prepare('DELETE FROM stk_details').run();
    db.prepare("DELETE FROM users WHERE role = 'stk'").run();
} catch (e) {
    console.log('STK cleanup error:', e.message);
}

const genericSTKs = [
    { name: 'STK Eğitim Gönüllüleri', email: 'egitim@stk.test', type: 'Eğitim' },
    { name: 'STK Çevre Koruma', email: 'cevre@stk.test', type: 'Çevre' },
    { name: 'STK Sağlık Vakfı', email: 'saglik@stk.test', type: 'Sağlık' },
    { name: 'STK Çocuk Hakları', email: 'cocuk@stk.test', type: 'Çocuk' },
    { name: 'STK Hayvan Dostları', email: 'hayvan@stk.test', type: 'Hayvan Hakları' },
    { name: 'STK İnsani Yardım', email: 'yardim@stk.test', type: 'Yardım' }
];

console.log('Creating generic STK accounts...');

const insertUser = db.prepare(`
    INSERT INTO users (email, password, first_name, last_name, role, status) 
    VALUES (?, ?, ?, ?, 'stk', 'approved')
`);

const insertStkDetails = db.prepare(`
    INSERT INTO stk_details (user_id, organization_name, description) 
    VALUES (?, ?, ?)
`);

const insertApp = db.prepare(`
    INSERT INTO stk_applications (user_id, organization_name, organization_type, description, status) 
    VALUES (?, ?, ?, ?, 'approved')
`);

genericSTKs.forEach(stk => {
    try {
        const userResult = insertUser.run(stk.email, 'stk123', stk.name, 'Derneği');
        const userId = userResult.lastInsertRowid;

        insertStkDetails.run(userId, stk.name, `${stk.name} tarafından yürütülen resmi bağış çalışmaları.`);
        insertApp.run(userId, stk.name, stk.type, `${stk.name} tarafından yürütülen resmi bağış çalışmaları.`);
        console.log(`Created STK: ${stk.name}`);
    } catch (err) {
        console.error(`Failed to create ${stk.name}:`, err.message);
    }
});

// Refresh list to get IDs
let stks = db.prepare("SELECT user_id, organization_name FROM stk_applications WHERE status = 'approved'").all();
const stkMap = stks;

console.log(`Using ${stks.length} Generic STKs:`, stks.map(s => s.organization_name));

// ==========================================
// SAMPLE CAMPAIGNS
// ==========================================

console.log('Creating sample campaigns...');

// Clear existing campaigns
try {
    db.prepare('DELETE FROM campaigns').run();
} catch (e) {
    console.log('Campaigns cleanup error:', e.message);
}

const sampleCampaigns = [
    {
        title: '1000 Köy Okuluna Kırtasiye Desteği',
        description: 'Türkiye\'nin en uzak köylerindeki öğrencilere kırtasiye malzemesi ulaştırıyoruz. Her çocuğun eğitime eşit erişim hakkı var. Bu kampanya ile defter, kalem, silgi ve diğer temel kırtasiye malzemelerini ihtiyaç sahibi öğrencilere ulaştırıyoruz.\n\nHedefimiz: 1000 köy okulundaki 50.000 öğrenciye ulaşmak.',
        target_amount: 500000,
        current_amount: 324500,
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        stkType: 'Eğitim'
    },
    {
        title: 'Akdeniz Kıyılarını Temizle',
        description: 'Akdeniz kıyılarımızdaki plastik kirliliğiyle mücadele ediyoruz. Gönüllülerimizle birlikte kıyı temizlik operasyonları düzenliyoruz.\n\nTopladığımız plastikler geri dönüştürülerek yeni ürünlere dönüştürülüyor. Temiz denizler, sağlıklı ekosistemler!',
        target_amount: 150000,
        current_amount: 89000,
        image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800',
        stkType: 'Çevre'
    },
    {
        title: 'Köy Sağlık Ocaklarına Tıbbi Malzeme',
        description: 'Kırsal bölgelerdeki sağlık ocaklarına temel tıbbi malzeme ve ilaç desteği sağlıyoruz. Sağlığa erişim herkesin hakkı.\n\nBu kampanya ile 200 köy sağlık ocağına tansiyon aleti, şeker ölçüm cihazı ve ilk yardım malzemeleri gönderiyoruz.',
        target_amount: 250000,
        current_amount: 175000,
        image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800',
        stkType: 'Sağlık'
    },
    {
        title: 'Çocuklara Oyuncak Kütüphanesi',
        description: 'Dezavantajlı mahallelerde çocuklar için oyuncak kütüphaneleri kuruyoruz. Çocuklar oyuncakları ödünç alabilecek ve paylaşmayı öğrenecek.\n\nHer çocuğun oynama hakkı var. 50 mahallede oyuncak kütüphanesi açmayı hedefliyoruz.',
        target_amount: 100000,
        current_amount: 67500,
        image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=800',
        stkType: 'Çocuk'
    },
    {
        title: 'Sokak Hayvanları İçin Kış Barınakları',
        description: 'Kış aylarında sokak hayvanlarının donmaktan korunması için sıcak barınaklar inşa ediyoruz. Her can değerli!\n\n100 farklı noktada yalıtımlı barınak yerleştireceğiz. Ayrıca düzenli mama ve su desteği sağlıyoruz.',
        target_amount: 80000,
        current_amount: 52000,
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
        stkType: 'Hayvan Hakları'
    },
    {
        title: 'Deprem Bölgesine Acil Yardım',
        description: 'Deprem bölgesindeki vatandaşlarımıza acil insani yardım ulaştırıyoruz. Gıda, battaniye, hijyen paketi ve çadır desteği sağlıyoruz.\n\nHer katkı hayat kurtarır. Birlikte daha güçlüyüz!',
        target_amount: 1000000,
        current_amount: 876000,
        image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
        stkType: 'Yardım'
    }
];

const insertCampaign = db.prepare(`
    INSERT INTO campaigns (stk_id, title, target_amount, current_amount, image, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
`);

sampleCampaigns.forEach(campaign => {
    // Find matching STK by type
    const matchingStk = stks.find(s => s.organization_name.includes(campaign.stkType));
    if (matchingStk) {
        try {
            insertCampaign.run(
                matchingStk.user_id,
                campaign.title,
                campaign.target_amount,
                campaign.current_amount,
                campaign.image,
                campaign.description
            );
            console.log(`✓ Campaign: ${campaign.title}`);
        } catch (err) {
            console.error(`✗ Campaign failed: ${campaign.title}`, err.message);
        }
    }
});

console.log('Campaigns seeding completed!');

// ==========================================
// UNIQUE PRODUCT DATA - Manuel Tanımlamalar
// ==========================================

// Her ürün için benzersiz açıklama ve özellikler
const uniqueProducts = [
    // ===== PET ÜRÜNLERI =====
    {
        name: 'Royal Canin Yetişkin Kedi Maması',
        brand: 'Royal Canin',
        price: 549.99,
        oldPrice: 699.99,
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500',
        description: 'Yetişkin kediler için özel olarak formüle edilmiş premium kalite mama. Zengin protein içeriği ile kasları destekler, taurin ile kalp ve göz sağlığını korur. Omega yağ asitleri sayesinde parlak ve sağlıklı bir tüy yapısı sağlar.',
        mainCategorySlug: 'ev-yasam',
        subCategorySlug: 'mutfak',
        donationPercent: 10,
        features: {
            'Ağırlık': '4 kg',
            'Yaş Grubu': 'Yetişkin (1-7 yaş)',
            'Protein Oranı': '%32',
            'Aroma': 'Tavuklu',
            'Özel Formül': 'Idrar Yolu Sağlığı',
            'Üretim Yeri': 'Fransa'
        },
        variantType: 'none'
    },
    {
        name: 'Köpek Tasması Premium Deri',
        brand: 'PetSafe',
        price: 189.00,
        oldPrice: 249.00,
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500',
        description: 'El yapımı gerçek deri köpek tasması. Paslanmaz çelik toka ve halka ile uzun ömürlü kullanım. Yumuşak iç astar sayesinde köpeğinizin boynunu tahriş etmez. Şık tasarımı ile her yürüyüşte dikkat çeker.',
        mainCategorySlug: 'ev-yasam',
        subCategorySlug: 'dekorasyon',
        donationPercent: 15,
        features: {
            'Malzeme': 'Gerçek Deri',
            'Boyut': 'M (35-45cm)',
            'Renk': 'Kahverengi',
            'Toka Tipi': 'Paslanmaz Çelik',
            'Su Geçirmezlik': 'Evet',
            'Garanti': '2 Yıl'
        },
        variantType: 'clothing'
    },
    {
        name: 'Kedi Tırmalama Tahtası Çok Katlı',
        brand: 'CatLife',
        price: 899.00,
        oldPrice: 1199.00,
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
        description: 'Doğal sisal iple kaplı çok katlı kedi tırmalama kulesi. 4 farklı oyun alanı, 2 yatak ve 1 tünel içerir. Kedilerin doğal tırmalama içgüdülerini karşılarken mobilyalarınızı korur. Kolay montaj ve sağlam yapısı ile uzun yıllar kullanılabilir.',
        mainCategorySlug: 'ev-yasam',
        subCategorySlug: 'mobilya',
        donationPercent: 12,
        features: {
            'Yükseklik': '120 cm',
            'Malzeme': 'Sisal + Peluş',
            'Kat Sayısı': '4',
            'Renk': 'Bej/Gri',
            'Taşıma Kapasitesi': '15 kg',
            'Montaj': 'Kolay (vidasız)'
        },
        variantType: 'none'
    },
    {
        name: 'Whiskas Yetişkin Kedi Konserve Set',
        brand: 'Whiskas',
        price: 89.90,
        oldPrice: null,
        image: 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=500',
        description: '12\'li ekonomik paket yaş kedi maması. Tavuklu ve balıklı çeşitler içerir. Jöleli dokusu kedilerin damak zevkine hitap eder. Vitamin ve mineral açısından zenginleştirilmiş formülü ile dengeli beslenme sağlar.',
        mainCategorySlug: 'ev-yasam',
        subCategorySlug: 'mutfak',
        donationPercent: 8,
        features: {
            'Paket İçeriği': '12 Adet x 85g',
            'Çeşit': 'Karışık (Tavuk/Balık)',
            'Yaş Grubu': 'Yetişkin',
            'Koruyucu': 'İçermez',
            'Glutensiz': 'Evet',
            'Raf Ömrü': '24 Ay'
        },
        variantType: 'none'
    },

    // ===== ELEKTRONİK =====
    {
        name: 'Apple iPhone 15 Pro',
        brand: 'Apple',
        price: 64999.00,
        oldPrice: 69999.00,
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
        description: 'A17 Pro çip ile güçlendirilmiş en yeni iPhone. Titanyum kasa, 48MP Pro kamera sistemi ve aksiyon butonu ile donatılmış. 6.1 inç Super Retina XDR ekran ve USB-C bağlantısı ile geleceğin teknolojisini yaşayın.',
        mainCategorySlug: 'elektronik',
        subCategorySlug: 'telefon',
        donationPercent: 5,
        features: {
            'Ekran': '6.1" Super Retina XDR',
            'İşlemci': 'A17 Pro',
            'Ana Kamera': '48MP + 12MP + 12MP',
            'Pil Ömrü': '23 Saat Video',
            'Malzeme': 'Titanyum',
            'Su Geçirmezlik': 'IP68'
        },
        variantType: 'tech'
    },
    {
        name: 'Samsung Galaxy S24 Ultra',
        brand: 'Samsung',
        price: 59999.00,
        oldPrice: 64999.00,
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
        description: 'Snapdragon 8 Gen 3 işlemci ile üstün performans. 200MP kamera ve Galaxy AI özellikleri ile fotoğrafçılık deneyiminizi dönüştürün. S Pen dahil, 6.8 inç Dynamic AMOLED 2X ekran.',
        mainCategorySlug: 'elektronik',
        subCategorySlug: 'telefon',
        donationPercent: 5,
        features: {
            'Ekran': '6.8" Dynamic AMOLED 2X',
            'İşlemci': 'Snapdragon 8 Gen 3',
            'Ana Kamera': '200MP + 12MP + 50MP + 10MP',
            'RAM': '12GB',
            'S Pen': 'Dahil',
            'Pil': '5000mAh'
        },
        variantType: 'tech'
    },
    {
        name: 'Sony WH-1000XM5 Kablosuz Kulaklık',
        brand: 'Sony',
        price: 9999.00,
        oldPrice: 12999.00,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        description: 'Endüstri lideri aktif gürültü engelleme teknolojisi. 30 saat pil ömrü, LDAC codec desteği ve multipoint bağlantı. Katlanabilir tasarımı ile seyahatlerinizde daima yanınızda.',
        mainCategorySlug: 'elektronik',
        subCategorySlug: 'kulaklik',
        donationPercent: 10,
        features: {
            'Gürültü Engelleme': 'Aktif (8 Mikrofon)',
            'Pil Ömrü': '30 Saat',
            'Şarj Süresi': '3 Saat',
            'Ağırlık': '250g',
            'Bluetooth': '5.2 (LDAC)',
            'Hızlı Şarj': '3dk = 3 Saat'
        },
        variantType: 'clothing'
    },
    {
        name: 'Apple Watch Series 9',
        brand: 'Apple',
        price: 17999.00,
        oldPrice: 19999.00,
        image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500',
        description: 'Çift dokunuş özelliği ile eller serbest kontrol. S9 SiP çip, her zaman açık Retina ekran ve gelişmiş sağlık takibi. Karbon nötr tasarımı ile çevreye duyarlı akıllı saat.',
        mainCategorySlug: 'elektronik',
        subCategorySlug: 'akilli-saat',
        donationPercent: 8,
        features: {
            'Ekran': 'Always-On Retina LTPO',
            'İşlemci': 'S9 SiP',
            'Su Dayanıklılığı': '50m',
            'Kasa Boyutu': '45mm',
            'GPS': 'Dahili',
            'Pil Ömrü': '18 Saat'
        },
        variantType: 'clothing'
    },

    // ===== GİYİM =====
    {
        name: 'Nike Air Max 270 Spor Ayakkabı',
        brand: 'Nike',
        price: 3499.00,
        oldPrice: 4299.00,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        description: 'İkonik Max Air yastıklama teknolojisi ile maksimum konfor. Hafif mesh üst kısım ayağın nefes almasını sağlar. Günlük kullanım ve spor aktiviteleri için ideal tasarım.',
        mainCategorySlug: 'erkek',
        subCategorySlug: 'erkek-ayakkabi',
        donationPercent: 12,
        features: {
            'Taban': 'Max Air 270',
            'Üst Malzeme': 'Mesh + Sentetik',
            'Kullanım': 'Günlük/Spor',
            'Ağırlık': '310g',
            'Kol Tipi': 'Bağcıklı',
            'Drop': '13mm'
        },
        variantType: 'shoes'
    },
    {
        name: 'Adidas Ultraboost 23 Koşu Ayakkabısı',
        brand: 'Adidas',
        price: 4999.00,
        oldPrice: 5499.00,
        image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=500',
        description: 'Boost teknolojisi ile sınırsız enerji geri dönüşü. Primeknit+ üst kısım çorap benzeri oturuş sağlar. Continental™ kauçuk taban ıslak zeminlerde bile mükemmel tutuş sunar.',
        mainCategorySlug: 'erkek',
        subCategorySlug: 'erkek-spor',
        donationPercent: 10,
        features: {
            'Taban': 'Boost + Continental',
            'Üst Malzeme': 'Primeknit+',
            'Kullanım': 'Koşu/Antrenman',
            'Destekleme': 'Nötr',
            'Ağırlık': '330g',
            'Drop': '10mm'
        },
        variantType: 'shoes'
    },
    {
        name: 'Zara Oversize Erkek Gömlek',
        brand: 'Zara',
        price: 899.00,
        oldPrice: null,
        image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500',
        description: '%100 pamuk kumaştan üretilmiş rahat kesim erkek gömlek. Oxford dokuma ve düğmeli yaka detayı ile klasik ve modern çizgileri birleştiriyor. Her mevsim giyilebilir.',
        mainCategorySlug: 'erkek',
        subCategorySlug: 'erkek-gomlek',
        donationPercent: 15,
        features: {
            'Kumaş': '%100 Pamuk Oxford',
            'Kesim': 'Oversize/Relaxed',
            'Yaka': 'Düğmeli',
            'Kol': 'Uzun (Katlanabilir)',
            'Yıkama': '30°C Makine',
            'Üretim': 'Türkiye'
        },
        variantType: 'clothing'
    },
    {
        name: 'Mango Kadın Trençkot',
        brand: 'Mango',
        price: 2499.00,
        oldPrice: 3299.00,
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500',
        description: 'Klasik kesim su itici trençkot. Çift sıra düğme detayı ve kemer ile zamansız şıklık. Astarlı iç yapısı ile sonbahar ve ilkbaharda ideal kullanım sunar.',
        mainCategorySlug: 'kadin',
        subCategorySlug: 'kadin-elbise',
        donationPercent: 12,
        features: {
            'Kumaş': 'Polyester Karışım',
            'Su İtici': 'Evet',
            'Boy': 'Diz Altı',
            'Düğme': 'Çift Sıra',
            'Kemer': 'Dahil',
            'Astar': 'Tam Astar'
        },
        variantType: 'clothing'
    },

    // ===== KOZMETİK =====
    {
        name: 'L\'Oreal Paris Revitalift Serum',
        brand: 'L\'Oreal',
        price: 449.00,
        oldPrice: 599.00,
        image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500',
        description: '%1.5 Saf Hyaluronik Asit içeren yoğun nemlendirici serum. Cildi 24 saat nemli tutar, ince çizgileri doldurur ve dolgun bir görünüm sağlar. Tüm cilt tipleri için uygundur.',
        mainCategorySlug: 'kozmetik',
        subCategorySlug: 'cilt-bakimi',
        donationPercent: 10,
        features: {
            'İçerik': '%1.5 Hyaluronik Asit',
            'Hacim': '30ml',
            'Cilt Tipi': 'Tüm Cilt Tipleri',
            'Etki': 'Nemlendirme + Dolgunluk',
            'Paraben': 'İçermez',
            'Vegan': 'Evet'
        },
        variantType: 'none'
    },
    {
        name: 'Chanel N°5 Eau de Parfum',
        brand: 'Chanel',
        price: 5499.00,
        oldPrice: null,
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
        description: '1921\'den beri ikonik kadın parfümü. Yasemin, gül ve sandal ağacı notalarıyla feminen ve sofistike bir koku. Lüksün ve zarafetin zamansız sembolü.',
        mainCategorySlug: 'kozmetik',
        subCategorySlug: 'parfum',
        donationPercent: 5,
        features: {
            'Hacim': '100ml',
            'Konsantrasyon': 'Eau de Parfum',
            'Üst Notalar': 'Aldehit, Bergamot',
            'Orta Notalar': 'Yasemin, Gül, Zambak',
            'Alt Notalar': 'Sandal, Vetiver',
            'Kalıcılık': '8+ Saat'
        },
        variantType: 'none'
    },

    // ===== EV & YAŞAM =====
    {
        name: 'IKEA MALM Yatak Çerçevesi',
        brand: 'IKEA',
        price: 4999.00,
        oldPrice: 5499.00,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        description: 'Modern ve minimalist tasarımlı çift kişilik yatak çerçevesi. Yüksek başlık ile okuma ve dinlenme konforu sağlar. Meşe kaplama yüzey, kolay temizlenir ve uzun ömürlüdür.',
        mainCategorySlug: 'ev-yasam',
        subCategorySlug: 'mobilya',
        donationPercent: 8,
        features: {
            'Boyut': '160x200cm',
            'Malzeme': 'Meşe Kaplama',
            'Başlık Yüksekliği': '100cm',
            'Yatak Yüksekliği': '38cm',
            'Lata': 'Dahil Değil',
            'Montaj': 'Gerekli'
        },
        variantType: 'none'
    },
    {
        name: 'Philips Hue Starter Kit',
        brand: 'Philips',
        price: 2999.00,
        oldPrice: 3499.00,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        description: 'Akıllı ev aydınlatma başlangıç seti. 3 adet renkli LED ampul, Bridge ve anahtar dahil. 16 milyon renk seçeneği ile istediğiniz atmosferi yaratın. Sesli asistanlarla uyumlu.',
        mainCategorySlug: 'ev-yasam',
        subCategorySlug: 'aydinlatma',
        donationPercent: 10,
        features: {
            'Set İçeriği': '3 Ampul + Bridge + Anahtar',
            'Renk': '16 Milyon Renk',
            'Watt': '9W (60W Eşdeğer)',
            'Duy': 'E27',
            'Uyumluluk': 'Alexa, Google Home, HomeKit',
            'Ömür': '25.000 Saat'
        },
        variantType: 'none'
    },

    // ===== ÇOCUK =====
    {
        name: 'LEGO City Polis Merkezi',
        brand: 'LEGO',
        price: 1899.00,
        oldPrice: 2199.00,
        image: 'https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=500',
        description: '668 parçalık detaylı polis merkezi seti. 5 minifigür, polis arabası, helikopter ve hücre dahil. Çocukların yaratıcılığını ve problem çözme becerilerini geliştiren eğitici oyuncak.',
        mainCategorySlug: 'cocuk',
        subCategorySlug: 'oyuncak',
        donationPercent: 15,
        features: {
            'Parça Sayısı': '668',
            'Minifigür': '5 Adet',
            'Yaş': '6+',
            'Tema': 'City Police',
            'Araçlar': 'Araba + Helikopter',
            'Boyut': '36 x 28 x 32 cm'
        },
        variantType: 'none'
    },
    {
        name: 'Chicco Bebek Arabası Travel System',
        brand: 'Chicco',
        price: 8999.00,
        oldPrice: 10999.00,
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
        description: 'Doğumdan itibaren kullanılabilir komple bebek arabası sistemi. Oto koltuğu, ana kucağı ve bebek arabası bir arada. Tek elle katlanabilir pratik tasarım.',
        mainCategorySlug: 'cocuk',
        subCategorySlug: 'bebek',
        donationPercent: 10,
        features: {
            'Yaş/Kilo': '0-15kg / 0-36 ay',
            'Ağırlık': '10.5kg',
            'Katlanma': 'Tek Elle',
            'Tekerlekler': 'Döner + Kilitlenebilir',
            'Güneşlik': 'UPF 50+',
            'İçerik': 'Oto Koltuğu + Ana Kucağı + Araba'
        },
        variantType: 'clothing'
    }
];

// ==========================================
// DATABASE INSERTION
// ==========================================

const getMainCatId = db.prepare('SELECT id FROM main_categories WHERE slug = ?');
const getSubCatId = db.prepare('SELECT id FROM sub_categories WHERE slug = ?');

const insertProduct = db.prepare(`
    INSERT INTO products (name, price, old_price, image, description, main_category_id, sub_category_id, brand, stock, rating, donation_percent, donation_org, stk_id, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertFeature = db.prepare(`
    INSERT INTO product_features (product_id, feature_name, feature_value) VALUES (?, ?, ?)
`);

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate variants based on type
const generateVariants = (productId, basePrice, type) => {
    if (type === 'clothing') {
        const colors = ['Siyah', 'Beyaz', 'Lacivert', 'Kırmızı', 'Bej'];
        const sizes = ['S', 'M', 'L', 'XL'];

        const insertLegacy = db.prepare('INSERT INTO product_variants (product_id, type, value, stock) VALUES (?, ?, ?, ?)');
        const selectedColors = [randomItem(colors), randomItem(colors)];
        [...new Set(selectedColors)].forEach(c => insertLegacy.run(productId, 'color', c, 50));
        sizes.forEach(s => insertLegacy.run(productId, 'size', s, 50));

        [...new Set(selectedColors)].forEach(color => {
            sizes.forEach(size => {
                const sku = `CLTH-${productId}-${color.substring(0, 3).toUpperCase()}-${size}`;
                const attributes = JSON.stringify({ "Renk": color, "Beden": size });
                db.prepare('INSERT INTO variants (product_id, sku, attributes, price, stock) VALUES (?, ?, ?, ?, ?)')
                    .run(productId, sku, attributes, basePrice, randomInt(5, 50));
            });
        });

    } else if (type === 'shoes') {
        const colors = ['Siyah', 'Beyaz', 'Lacivert'];
        const sizes = ['39', '40', '41', '42', '43', '44'];

        const insertLegacy = db.prepare('INSERT INTO product_variants (product_id, type, value, stock) VALUES (?, ?, ?, ?)');
        const selectedColor = randomItem(colors);
        insertLegacy.run(productId, 'color', selectedColor, 50);
        sizes.forEach(s => insertLegacy.run(productId, 'size', s, 30));

        sizes.forEach(size => {
            const sku = `SHOE-${productId}-${selectedColor.substring(0, 3).toUpperCase()}-${size}`;
            const attributes = JSON.stringify({ "Renk": selectedColor, "Numara": size });
            db.prepare('INSERT INTO variants (product_id, sku, attributes, price, stock) VALUES (?, ?, ?, ?, ?)')
                .run(productId, sku, attributes, basePrice, randomInt(5, 25));
        });

    } else if (type === 'tech') {
        const memories = ['128GB', '256GB', '512GB'];
        const colors = ['Siyah', 'Gümüş', 'Altın'];

        const insertLegacy = db.prepare('INSERT INTO product_variants (product_id, type, value, stock) VALUES (?, ?, ?, ?)');
        memories.forEach(m => insertLegacy.run(productId, 'memory', m, 20));

        const color = randomItem(colors);
        memories.forEach((memory, idx) => {
            const sku = `TECH-${productId}-${memory}`;
            const attributes = JSON.stringify({ "Renk": color, "Hafıza": memory });
            const priceDiff = idx * 2000;
            db.prepare('INSERT INTO variants (product_id, sku, attributes, price, stock) VALUES (?, ?, ?, ?, ?)')
                .run(productId, sku, attributes, basePrice + priceDiff, randomInt(5, 20));
        });
    }
};

// Insert products
console.log('\nInserting unique products...');

uniqueProducts.forEach((product, index) => {
    try {
        const mainCat = getMainCatId.get(product.mainCategorySlug);
        const subCat = getSubCatId.get(product.subCategorySlug);

        if (!mainCat) {
            console.warn(`Main category not found: ${product.mainCategorySlug}`);
            return;
        }

        const stk = randomItem(stkMap);
        const isFeatured = index < 4 ? 1 : 0;

        const result = insertProduct.run(
            product.name,
            product.price,
            product.oldPrice,
            product.image,
            product.description,
            mainCat.id,
            subCat ? subCat.id : null,
            product.brand,
            randomInt(20, 100),
            randomInt(10, 150),
            product.donationPercent,
            stk.organization_name,
            stk.user_id,
            isFeatured
        );

        const productId = result.lastInsertRowid;

        // Insert features
        if (product.features) {
            Object.entries(product.features).forEach(([key, value]) => {
                insertFeature.run(productId, key, value);
            });
        }

        // Generate variants
        if (product.variantType && product.variantType !== 'none') {
            generateVariants(productId, product.price, product.variantType);
        }

        console.log(`✓ Added: ${product.name}`);

    } catch (error) {
        console.error(`✗ Failed: ${product.name} - ${error.message}`);
    }
});

console.log('\n========================================');
console.log('Product seeding completed successfully!');
console.log(`Total unique products: ${uniqueProducts.length}`);
console.log('========================================\n');
