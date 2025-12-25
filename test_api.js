// Minimal test for card addition
async function test() {
    const baseUrl = 'http://localhost:3000/api';

    // Login as existing user (to simplify test)
    console.log('Logging in...');
    const res = await fetch(`${baseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
    });

    const data = await res.json();
    console.log('Login response:', data);

    if (!data.token) {
        console.log('No token, trying to register...');
        const regRes = await fetch(`${baseUrl}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test123', firstName: 'Test', lastName: 'User' })
        });
        console.log('Register:', await regRes.json());

        // Login again
        const loginRes = await fetch(`${baseUrl}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
        });
        const loginData = await loginRes.json();
        console.log('Login after register:', loginData);
        if (!loginData.token) {
            console.log('FAILED TO GET TOKEN');
            return;
        }
        data.token = loginData.token;
    }

    const token = data.token;
    console.log('Token:', token);

    // Test card addition
    const cardData = {
        cardName: 'TEST CARD HOLDER',
        cardNumber: '4111111111111111',
        expiryDate: '12/25'
    };
    console.log('Sending card data:', JSON.stringify(cardData));

    const cardRes = await fetch(`${baseUrl}/user/cards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cardData)
    });

    console.log('Status:', cardRes.status, cardRes.statusText);
    const cardText = await cardRes.text();
    console.log('Response:', cardText);
    require('fs').writeFileSync('test_output.txt', cardText);
}

test().catch(console.error);
