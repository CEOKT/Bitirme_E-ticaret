const http = require('http');

const sessionId = 'test_session_' + Date.now();
const productId = 1; // Assuming product ID 1 exists (from database init)

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[${method} ${path}] Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    // console.log('Response:', json);
                    resolve(json);
                } catch (e) {
                    console.error('Failed to parse JSON:', data);
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[${method} ${path}] Error: ${e.message}`);
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Cart API ---');

    // Add item to cart
    console.log('Adding item to cart...');
    await request('POST', '/cart', { sessionId, productId, quantity: 2 });

    // Get cart count
    console.log('Getting cart count...');
    const countRes = await request('GET', `/cart/${sessionId}/count`);
    console.log('Cart count:', countRes);

    // Get cart items
    console.log('Getting cart items...');
    const itemsRes = await request('GET', `/cart/${sessionId}`);
    console.log('Cart items:', itemsRes);

    console.log('\n--- Testing Favorites API ---');

    // Add to favorites
    console.log('Adding to favorites...');
    await request('POST', '/favorites', { sessionId, productId });

    // Check if favorite
    console.log('Checking isFavorite...');
    const checkRes = await request('GET', `/favorites/${sessionId}/check/${productId}`);
    console.log('Is favorite:', checkRes);

    // Get favorites
    console.log('Getting favorites...');
    const favRes = await request('GET', `/favorites/${sessionId}`);
    console.log('Favorites:', favRes);

    // Toggle favorite
    console.log('Toggling favorite (should remove)...');
    const toggleRes = await request('POST', '/favorites/toggle', { sessionId, productId });
    console.log('Toggle result:', toggleRes);
}

runTests().catch(console.error);
