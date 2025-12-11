// using native fetch
// Since previous test failed with require, and native fetch might be available.

async function verifyPersistence() {
    const timestamp = Date.now();
    const payload = {
        name: `Verify Product ${timestamp}`,
        price: 150,
        image: "http://example.com/img.jpg",
        description: "Test persistence",
        mainCategory: "UniqueMain_" + timestamp,
        subCategory: "UniqueSub_" + timestamp,
        brand: "TestBrand",
        stock: 50,
        donationPercent: 10,
        donationOrg: "TEGV",
        colors: ["V_Color1", "V_Color2"],
        sizes: ["V_Size1", "V_Size2"],
        memories: ["V_Mem1", "V_Mem2"]
    };

    console.log('Sending payload:', payload);

    try {
        // Native fetch in Node 18+
        const response = await fetch('http://localhost:3000/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Create Response:', result);

        if (result.productId) {
            console.log('Product created. Verifying DB content...');
            // I'll call a check script or just rely on console output if I chain it.
            // But I can't call DB directly easily from here if I want to simulate "client" fully.
            // But I have access to filesystem so I can require database.js

            const db = require('./database');
            const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.productId);
            console.log('DB Product:', product);

            if (product.main_category !== payload.mainCategory) console.error('FAIL: main_category mismatch');
            if (product.sub_category !== payload.subCategory) console.error('FAIL: sub_category mismatch');

            const variants = db.prepare('SELECT type, value FROM product_variants WHERE product_id = ?').all(result.productId);
            console.log('DB Variants:', variants);

            const colors = variants.filter(v => v.type === 'color').map(v => v.value);
            const sizes = variants.filter(v => v.type === 'size').map(v => v.value);
            const memories = variants.filter(v => v.type === 'memory').map(v => v.value);

            console.log('Checking Colors:', JSON.stringify(colors) === JSON.stringify(payload.colors) ? 'PASS' : 'FAIL');
            console.log('Checking Sizes:', JSON.stringify(sizes) === JSON.stringify(payload.sizes) ? 'PASS' : 'FAIL');
            console.log('Checking Memories:', JSON.stringify(memories) === JSON.stringify(payload.memories) ? 'PASS' : 'FAIL');
        } else {
            console.error('Failed to create product');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

verifyPersistence();
