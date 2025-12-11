// using native fetch
// If not, I'll use native fetch if node 18+
// Start with native fetch

async function testCreate() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test Variant Product",
                price: 100,
                image: "http://example.com/img.jpg",
                description: "Test",
                mainCategory: "Test",
                brand: "Test",
                colors: ["Red", "Blue"],
                sizes: ["S", "M", "L"],
                memories: ["64GB", "128GB"]
            })
        });

        const result = await response.json();
        console.log('Create Result:', result);
    } catch (e) {
        console.error(e);
    }
}

testCreate();
