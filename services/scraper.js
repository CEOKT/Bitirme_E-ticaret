const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database');

/**
 * Scrapes product data from a given URL and saves it as a Campaign Product for an STK.
 * @param {string} url - The URL of the product page.
 * @param {number} stkId - The ID of the STK creating the campaign.
 * @param {number} campaignId - Optional: Link to a specific campaign (if table used).
 * @returns {Promise<Object>} - The saved product object.
 */
async function scrapeAndSave(url, stkId) {
    try {
        // Validation
        if (!url || !stkId) {
            throw new Error('URL ve STK ID zorunludur.');
        }

        // 1. Fetch HTML
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 2. Parse HTML
        const $ = cheerio.load(data);

        // 3. Extract Meta Data (Open Graph is most reliable across sites)
        let title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        let image = $('meta[property="og:image"]').attr('content');
        let description = $('meta[property="og:description"]').attr('content');

        // Check if specific known sites (optional fallback/overrides)
        // ... here we could add if (url.includes('trendyol')) { ... } logic

        // Price Extraction is tricky as it varies heavily. 
        // We look for common price classes or regex in body text near 'TL'
        let price = 0;

        // Strategy 1: Look for meta price
        const metaPrice = $('meta[property="product:price:amount"]').attr('content');
        if (metaPrice) {
            price = parseFloat(metaPrice);
        } else {
            // Strategy 2: Regex search in common elements
            // Note: This is a loose approximation for "Example Petshop"
            // Let's assume the user might input a URL that has price in standard format
            const priceText = $('span[class*="price"], div[class*="price"], .product-price').first().text();
            if (priceText) {
                // Extract numbers
                const match = priceText.match(/([\d.,]+)/);
                if (match) {
                    price = parseFloat(match[0].replace(/\./g, '').replace(',', '.')); // TR format assumption
                }
            }
        }

        // Apply fallback if still 0
        if (!price || isNaN(price)) {
            price = 100; // Default fallback for demo purposes if scraping fails
        }

        if (!title) title = "Kampanya Ürünü";
        if (!image) image = "https://via.placeholder.com/500?text=Urun+Resmi";

        // 4. Save to Database
        // Get "Bagis Kampanyasi" Category ID
        const cat = db.prepare("SELECT id FROM main_categories WHERE slug = 'bagis-kampanyasi'").get();
        const mainCatId = cat ? cat.id : 1; // Fallback to first cat

        const stmt = db.prepare(`
            INSERT INTO products (name, price, image, description, main_category_id, brand, stock, donation_percent, stk_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(title, price, image, description || 'Destek ürünü', mainCatId, 'Bağış', 100, 100, stkId);

        return {
            success: true,
            productId: result.lastInsertRowid,
            product: { title, price, image }
        };

    } catch (error) {
        console.error('Scraper Error:', error.message);
        throw new Error('Ürün bilgileri çekilemedi: ' + error.message);
    }
}

module.exports = { scrapeAndSave };
