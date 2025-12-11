const http = require('http');

function postRequest(data) {
    const postData = JSON.stringify(data);
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/products',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
            console.log('Response Status:', res.statusCode);
            console.log('Response Body:', responseBody);

            try {
                const result = JSON.parse(responseBody);
                if (result.productId) {
                    checkProduct(result.productId);
                }
            } catch (e) {
                console.error('Error parsing response:', e);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

function checkProduct(id) {
    http.get(`http://localhost:3000/api/products/${id}`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Check Product Result:', data);
            const product = JSON.parse(data);
            console.log('Colors:', product.colors);
            console.log('Sizes:', product.sizes);
            console.log('Memories:', product.memories);
        });
    });
}

const payload = {
    name: "Debug Variant Product",
    price: 100,
    image: "http://example.com/img.jpg",
    description: "Debug",
    mainCategory: "DebugCat",
    subCategory: "DebugSub",
    brand: "DebugBrand",
    stock: 50,
    donationPercent: 10,
    donationOrg: "TEGV",
    colors: ["D_Red", "D_Blue"],
    sizes: ["D_Small", "D_Medium"],
    memories: ["D_64GB"]
};

console.log('Sending Payload:', payload);
postRequest(payload);
