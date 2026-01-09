// Script to download Trendyol images and save locally
const https = require('https');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');
const imagesDir = path.join(__dirname, 'images', 'campaigns');

// Create campaigns images directory if not exists
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created directory:', imagesDir);
}

// Get campaign products
const products = db.prepare('SELECT id, name, image FROM products WHERE donation_percent = 100').all();
console.log(`Found ${products.length} campaign products\n`);

// Download function
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.trendyol.com/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                https.get(response.headers.location, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(true);
                    });
                }).on('error', reject);
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                reject(new Error(`HTTP ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filename, () => { });
            reject(err);
        });
    });
}

// Process all products
async function processProducts() {
    for (const product of products) {
        const ext = path.extname(product.image.split('?')[0]) || '.jpg';
        const localFilename = `campaign_${product.id}${ext}`;
        const localPath = path.join(imagesDir, localFilename);
        const dbPath = `images/campaigns/${localFilename}`;

        console.log(`Downloading: ${product.name.substring(0, 40)}...`);

        try {
            await downloadImage(product.image, localPath);

            // Update database with local path
            db.prepare('UPDATE products SET image = ? WHERE id = ?').run(dbPath, product.id);
            console.log(`  ✓ Saved: ${dbPath}`);
        } catch (error) {
            console.log(`  ✗ Failed: ${error.message}`);
        }
    }

    console.log('\n✅ Done!');
    db.close();
}

processProducts();
