const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper to generate session ID
function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Helper to create slug from text
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Get or create main category by name
function getOrCreateMainCategory(name) {
    if (!name) return null;
    const existing = db.prepare('SELECT id FROM main_categories WHERE name = ?').get(name);
    if (existing) return existing.id;

    const slug = slugify(name);
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM main_categories').get();
    const result = db.prepare('INSERT INTO main_categories (name, slug, sort_order) VALUES (?, ?, ?)').run(name, slug, (maxOrder.max || 0) + 1);
    return result.lastInsertRowid;
}

// Get or create sub category by name (requires main category ID)
function getOrCreateSubCategory(name, mainCategoryId) {
    if (!name || !mainCategoryId) return null;
    const existing = db.prepare('SELECT id FROM sub_categories WHERE name = ? AND main_category_id = ?').get(name, mainCategoryId);
    if (existing) return existing.id;

    const slug = slugify(name);
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM sub_categories WHERE main_category_id = ?').get(mainCategoryId);
    const result = db.prepare('INSERT INTO sub_categories (main_category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)').run(mainCategoryId, name, slug, (maxOrder.max || 0) + 1);
    return result.lastInsertRowid;
}

// =============================================
// USER AUTHENTICATION API
// =============================================

// User registration
app.post('/api/users/register', (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        // Check if email already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Bu e-posta adresi zaten kayıtlı' });
        }

        // Insert new user
        const result = db.prepare(`
            INSERT INTO users (first_name, last_name, email, phone, password)
            VALUES (?, ?, ?, ?, ?)
        `).run(firstName, lastName, email, phone || null, password);

        res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// User login
app.post('/api/users/login', (req, res) => {
    try {
        const { email, password } = req.body;

        const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);

        if (!user) {
            return res.status(401).json({ success: false, error: 'Geçersiz e-posta veya şifre' });
        }

        if (user.is_blocked) {
            return res.status(403).json({ success: false, error: 'Hesabınız engellenmiş' });
        }

        // Generate session ID
        const sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        res.json({
            success: true,
            sessionId,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user profile
app.get('/api/users/:id', (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ?').get(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            createdAt: user.created_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
app.put('/api/users/:id', (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;

        db.prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?')
            .run(firstName, lastName, phone, req.params.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// PRODUCTS API
// =============================================

// Get all products
// Get all products
app.get('/api/products', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT p.*, mc.name as main_category_name, sc.name as sub_category_name 
            FROM products p 
            LEFT JOIN main_categories mc ON p.main_category_id = mc.id 
            LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id 
            ORDER BY p.id DESC
        `).all();

        const result = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            oldPrice: product.old_price,
            image: product.image,
            description: product.description,
            mainCategoryId: product.main_category_id,
            mainCategoryName: product.main_category_name,
            subCategoryId: product.sub_category_id,
            subCategoryName: product.sub_category_name,
            brand: product.brand,
            stock: product.stock,
            rating: product.rating,
            donationPercent: product.donation_percent,
            donationOrg: product.donation_org,
            isFeatured: product.is_featured
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by main category ID
app.get('/api/products/category/:categoryId', (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const products = db.prepare('SELECT p.*, mc.name as main_category_name, sc.name as sub_category_name FROM products p LEFT JOIN main_categories mc ON p.main_category_id = mc.id LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id WHERE p.main_category_id = ?').all(categoryId);

        const result = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            oldPrice: product.old_price,
            image: product.image,
            description: product.description,
            mainCategoryId: product.main_category_id,
            mainCategoryName: product.main_category_name,
            subCategoryId: product.sub_category_id,
            subCategoryName: product.sub_category_name,
            brand: product.brand,
            stock: product.stock,
            rating: product.rating,
            donationPercent: product.donation_percent,
            donationOrg: product.donation_org
        }));

        // Get subcategories for this main category
        const subCategories = db.prepare('SELECT * FROM sub_categories WHERE main_category_id = ? ORDER BY sort_order').all(categoryId);

        // Get main category info
        const mainCategory = db.prepare('SELECT * FROM main_categories WHERE id = ?').get(categoryId);

        res.json({ products: result, subCategories, mainCategory });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by subcategory ID
app.get('/api/products/subcategory/:subCategoryId', (req, res) => {
    try {
        const subCatId = parseInt(req.params.subCategoryId);
        const products = db.prepare('SELECT p.*, mc.name as main_category_name, sc.name as sub_category_name FROM products p LEFT JOIN main_categories mc ON p.main_category_id = mc.id LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id WHERE p.sub_category_id = ?').all(subCatId);

        const result = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            oldPrice: product.old_price,
            image: product.image,
            description: product.description,
            mainCategoryId: product.main_category_id,
            mainCategoryName: product.main_category_name,
            subCategoryId: product.sub_category_id,
            subCategoryName: product.sub_category_name,
            brand: product.brand,
            stock: product.stock,
            rating: product.rating,
            donationPercent: product.donation_percent,
            donationOrg: product.donation_org
        }));

        // Get subcategory info with main category
        const subCategory = db.prepare('SELECT sc.*, mc.name as main_category_name, mc.id as main_category_id FROM sub_categories sc JOIN main_categories mc ON sc.main_category_id = mc.id WHERE sc.id = ?').get(subCatId);

        res.json({ products: result, subCategory });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all main categories with subcategories
app.get('/api/categories', (req, res) => {
    try {
        const mainCategories = db.prepare('SELECT * FROM main_categories ORDER BY sort_order').all();

        const result = mainCategories.map(cat => {
            const subCategories = db.prepare('SELECT * FROM sub_categories WHERE main_category_id = ? ORDER BY sort_order').all(cat.id);
            return {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                description: cat.description,
                subCategories: subCategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    slug: sub.slug
                }))
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const features = db.prepare('SELECT feature_name, feature_value FROM product_features WHERE product_id = ?').all(req.params.id);
        const featuresObj = {};
        features.forEach(f => {
            featuresObj[f.feature_name] = f.feature_value;
        });

        const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id);

        // Fetch legacy variants (for backward compatibility)
        const legacyVariants = db.prepare('SELECT type, value, stock FROM product_variants WHERE product_id = ?').all(req.params.id);
        const colors = legacyVariants.filter(v => v.type === 'color').map(v => v.value);
        const sizes = legacyVariants.filter(v => v.type === 'size').map(v => v.value);
        const memories = legacyVariants.filter(v => v.type === 'memory').map(v => v.value);

        // Fetch SKU-based variants (new system)
        const skuVariants = db.prepare('SELECT id, sku, attributes, price, stock, image FROM variants WHERE product_id = ?').all(req.params.id);
        const parsedVariants = skuVariants.map(v => ({
            id: v.id,
            sku: v.sku,
            attributes: JSON.parse(v.attributes),
            price: v.price,
            stock: v.stock,
            image: v.image
        }));

        res.json({
            id: product.id,
            name: product.name,
            brand: product.brand,
            title: product.title,
            price: product.price,
            oldPrice: product.old_price,
            image: product.image,
            description: product.description,
            rating: product.rating,
            category: product.category,
            donationPercent: product.donation_percent,
            donationOrg: product.donation_org,
            features: featuresObj,
            reviews: reviews,
            colors: colors,
            sizes: sizes,
            memories: memories,
            variants: parsedVariants
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by category
app.get('/api/products/category/:category', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE category = ?').all(req.params.category);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by brand
app.get('/api/products/brand/:brandSlug', (req, res) => {
    try {
        const brand = db.prepare('SELECT * FROM brands WHERE slug = ?').get(req.params.brandSlug);
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        const products = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(brand.id);
        res.json({ brand, products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by gender
app.get('/api/products/gender/:gender', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE gender = ? OR gender = ?').all(req.params.gender, 'unisex');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search products
app.get('/api/products/search/:query', (req, res) => {
    try {
        const query = `%${req.params.query}%`;
        const products = db.prepare(`
            SELECT * FROM products 
            WHERE title LIKE ? OR brand LIKE ? OR description LIKE ?
        `).all(query, query, query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// CATEGORIES API
// =============================================

// Get all categories (hierarchical)
app.get('/api/categories', (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();

        // Build hierarchical structure
        const mainCategories = categories.filter(c => !c.parent_id);
        const result = mainCategories.map(main => ({
            ...main,
            subcategories: categories.filter(c => c.parent_id === main.id)
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single category with products
app.get('/api/categories/:slug', (req, res) => {
    try {
        const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get subcategories if main category
        const subcategories = db.prepare('SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order').all(category.id);

        // Get products - if main category, get all products from subcategories too
        let products;
        if (subcategories.length > 0) {
            const subcatIds = subcategories.map(s => s.id);
            products = db.prepare(`
                SELECT * FROM products 
                WHERE category_id IN (${subcatIds.join(',')}) OR category_id = ?
            `).all(category.id);
        } else {
            products = db.prepare('SELECT * FROM products WHERE category_id = ?').all(category.id);
        }

        // Get parent category if subcategory
        let parent = null;
        if (category.parent_id) {
            parent = db.prepare('SELECT * FROM categories WHERE id = ?').get(category.parent_id);
        }

        res.json({
            category,
            parent,
            subcategories,
            products
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// BRANDS API
// =============================================

// Get all brands
app.get('/api/brands', (req, res) => {
    try {
        const brands = db.prepare('SELECT * FROM brands ORDER BY name').all();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get featured brands
app.get('/api/brands/featured', (req, res) => {
    try {
        const brands = db.prepare('SELECT * FROM brands WHERE is_featured = 1 ORDER BY name').all();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single brand with products
app.get('/api/brands/:slug', (req, res) => {
    try {
        const brand = db.prepare('SELECT * FROM brands WHERE slug = ?').get(req.params.slug);

        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        const products = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(brand.id);

        res.json({
            brand,
            products
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// CART API
// =============================================

// Get cart items
app.get('/api/cart/:sessionId', (req, res) => {
    try {
        const items = db.prepare(`
            SELECT c.id, c.product_id, c.quantity, c.selected_color, c.selected_size, c.selected_memory, p.brand, p.name as title, p.price, p.image
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.session_id = ?
        `).all(req.params.sessionId);

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add to cart
app.post('/api/cart', (req, res) => {
    try {
        const { sessionId, productId, quantity = 1, selectedColor, selectedSize, selectedMemory } = req.body;

        // Check if item already in cart with same variants
        const existing = db.prepare('SELECT * FROM cart WHERE session_id = ? AND product_id = ? AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL)) AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL)) AND (selected_memory = ? OR (selected_memory IS NULL AND ? IS NULL))').get(sessionId, productId, selectedColor, selectedColor, selectedSize, selectedSize, selectedMemory, selectedMemory);

        if (existing) {
            db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
        } else {
            db.prepare('INSERT INTO cart (session_id, product_id, quantity, selected_color, selected_size, selected_memory) VALUES (?, ?, ?, ?, ?, ?)').run(sessionId, productId, quantity, selectedColor || null, selectedSize || null, selectedMemory || null);
        }

        // Get updated cart count
        const count = db.prepare('SELECT SUM(quantity) as total FROM cart WHERE session_id = ?').get(sessionId);

        res.json({ success: true, cartCount: count.total || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update cart item quantity
app.put('/api/cart/:sessionId/:productId', (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity <= 0) {
            db.prepare('DELETE FROM cart WHERE session_id = ? AND product_id = ?').run(req.params.sessionId, req.params.productId);
        } else {
            db.prepare('UPDATE cart SET quantity = ? WHERE session_id = ? AND product_id = ?').run(quantity, req.params.sessionId, req.params.productId);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from cart
app.delete('/api/cart/:sessionId/:productId', (req, res) => {
    try {
        db.prepare('DELETE FROM cart WHERE session_id = ? AND product_id = ?').run(req.params.sessionId, req.params.productId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cart count
app.get('/api/cart/:sessionId/count', (req, res) => {
    try {
        const count = db.prepare('SELECT SUM(quantity) as total FROM cart WHERE session_id = ?').get(req.params.sessionId);
        res.json({ count: count.total || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// FAVORITES API
// =============================================

// Get favorites
app.get('/api/favorites/:sessionId', (req, res) => {
    try {
        const favorites = db.prepare(`
            SELECT f.product_id, p.brand, p.name as title, p.price, p.image, p.rating
            FROM favorites f
            JOIN products p ON f.product_id = p.id
            WHERE f.session_id = ?
        `).all(req.params.sessionId);

        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add to favorites
app.post('/api/favorites', (req, res) => {
    try {
        const { sessionId, productId } = req.body;

        // Check if already in favorites
        const existing = db.prepare('SELECT * FROM favorites WHERE session_id = ? AND product_id = ?').get(sessionId, productId);

        if (!existing) {
            db.prepare('INSERT INTO favorites (session_id, product_id) VALUES (?, ?)').run(sessionId, productId);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from favorites
app.delete('/api/favorites/:sessionId/:productId', (req, res) => {
    try {
        db.prepare('DELETE FROM favorites WHERE session_id = ? AND product_id = ?').run(req.params.sessionId, req.params.productId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle favorite
app.post('/api/favorites/toggle', (req, res) => {
    try {
        const { sessionId, productId } = req.body;

        const existing = db.prepare('SELECT * FROM favorites WHERE session_id = ? AND product_id = ?').get(sessionId, productId);

        if (existing) {
            db.prepare('DELETE FROM favorites WHERE session_id = ? AND product_id = ?').run(sessionId, productId);
            res.json({ success: true, isFavorite: false });
        } else {
            db.prepare('INSERT INTO favorites (session_id, product_id) VALUES (?, ?)').run(sessionId, productId);
            res.json({ success: true, isFavorite: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if product is favorite
app.get('/api/favorites/:sessionId/check/:productId', (req, res) => {
    try {
        const favorite = db.prepare('SELECT * FROM favorites WHERE session_id = ? AND product_id = ?').get(req.params.sessionId, req.params.productId);
        res.json({ isFavorite: !!favorite });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all favorite product IDs
app.get('/api/favorites/:sessionId/ids', (req, res) => {
    try {
        const favorites = db.prepare('SELECT product_id FROM favorites WHERE session_id = ?').all(req.params.sessionId);
        res.json(favorites.map(f => f.product_id));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// REVIEWS API
// =============================================

// Get reviews for product
app.get('/api/reviews/:productId', (req, res) => {
    try {
        const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(req.params.productId);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add review
app.post('/api/reviews', (req, res) => {
    try {
        const { productId, userName, rating, comment } = req.body;

        const result = db.prepare('INSERT INTO reviews (product_id, user_name, rating, comment) VALUES (?, ?, ?, ?)').run(productId, userName, rating, comment);

        // Update product rating count
        const stats = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE product_id = ?').get(productId);
        db.prepare('UPDATE products SET rating = ? WHERE id = ?').run(stats.count, productId);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// SESSION API
// =============================================

// Create new session
app.post('/api/session', (req, res) => {
    const sessionId = generateSessionId();
    res.json({ sessionId });
});

// =============================================
// USER API
// =============================================

// Register new user
app.post('/api/users/register', (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        // Check if user exists
        const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'Bu email zaten kayıtlı' });
        }

        // Insert user
        const result = db.prepare(`
            INSERT INTO users (email, password, first_name, last_name, phone)
            VALUES (?, ?, ?, ?, ?)
        `).run(email, password, firstName, lastName, phone);

        res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
app.post('/api/users/login', (req, res) => {
    try {
        const { email, password } = req.body;

        const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);

        if (!user) {
            return res.status(401).json({ error: 'Email veya şifre hatalı' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/users/:sessionId/profile', (req, res) => {
    try {
        // Get user from localStorage session or return guest profile
        const sessionId = req.params.sessionId;

        // Check if there's a logged in user for this session
        // For now, return sample data for demo
        res.json({
            id: 1,
            email: 'kullanici@email.com',
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            phone: '+90 532 123 45 67',
            isGuest: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
app.put('/api/users/:sessionId/profile', (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;

        // For demo, just return success
        // In real app, update user table if logged in
        res.json({
            success: true,
            message: 'Profil güncellendi'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ADDRESSES API
// =============================================

app.get('/api/addresses/:sessionId', (req, res) => {
    try {
        const addresses = db.prepare('SELECT * FROM addresses WHERE session_id = ? ORDER BY is_default DESC, created_at DESC').all(req.params.sessionId);
        res.json(addresses.map(a => ({
            id: a.id,
            title: a.title,
            fullAddress: a.full_address,
            district: a.district,
            city: a.city,
            postalCode: a.postal_code,
            isDefault: !!a.is_default
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/addresses', (req, res) => {
    try {
        const { sessionId, title, fullAddress, district, city, postalCode } = req.body;

        // If first address, make it default
        const count = db.prepare('SELECT COUNT(*) as count FROM addresses WHERE session_id = ?').get(sessionId);
        const isDefault = count.count === 0 ? 1 : 0;

        const result = db.prepare(`
            INSERT INTO addresses (session_id, title, full_address, district, city, postal_code, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(sessionId, title, fullAddress, district, city, postalCode, isDefault);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/addresses/:sessionId/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM addresses WHERE session_id = ? AND id = ?').run(req.params.sessionId, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// CARDS API
// =============================================

app.get('/api/cards/:sessionId', (req, res) => {
    try {
        const cards = db.prepare('SELECT * FROM payment_cards WHERE session_id = ? ORDER BY created_at DESC').all(req.params.sessionId);
        res.json(cards.map(c => ({
            id: c.id,
            cardName: c.card_name,
            cardNumberMasked: c.card_number_masked,
            expiryDate: c.expiry_date,
            cardType: c.card_type
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cards', (req, res) => {
    try {
        const { sessionId, cardName, cardNumber, expiryDate } = req.body;

        // Mask card number (keep last 4 digits)
        const masked = '**** **** **** ' + cardNumber.slice(-4);

        // Determine type roughly
        const type = cardNumber.startsWith('4') ? 'visa' : 'mastercard';

        const result = db.prepare(`
            INSERT INTO payment_cards (session_id, card_name, card_number_masked, expiry_date, card_type)
            VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, cardName, masked, expiryDate, type);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/cards/:sessionId/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM payment_cards WHERE session_id = ? AND id = ?').run(req.params.sessionId, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ORDERS API
// =============================================

// Get user orders
app.get('/api/orders/:sessionId', (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT o.*, 
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o 
            WHERE o.session_id = ? 
            ORDER BY o.created_at DESC
        `).all(req.params.sessionId);

        // Get items for each order
        const itemsStmt = db.prepare(`
            SELECT oi.*, p.name as title, p.brand, p.image
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `);

        const result = orders.map(order => ({
            ...order,
            items: itemsStmt.all(order.id)
        }));

        res.json(result);
    } catch (error) {
        console.error('Error in /api/orders/:sessionId:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create order from cart
app.post('/api/orders', (req, res) => {
    try {
        const { sessionId } = req.body;

        // Get cart items
        const cartItems = db.prepare(`
            SELECT c.*, p.price, p.donation_percent
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.session_id = ?
        `).all(sessionId);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Sepet boş' });
        }

        // Calculate totals
        let totalAmount = 0;
        let donationAmount = 0;

        cartItems.forEach(item => {
            let price;
            if (typeof item.price === 'number') {
                price = item.price;
            } else {
                // Assume string format "1.234,56 TL"
                price = parseFloat(String(item.price).replace(/\./g, '').replace(',', '.').replace(' TL', ''));
            }

            const itemTotal = price * item.quantity;
            totalAmount += itemTotal;
            donationAmount += itemTotal * (item.donation_percent / 100);
        });

        // Create order
        const orderResult = db.prepare(`
            INSERT INTO orders (session_id, total_amount, donation_amount, status)
            VALUES (?, ?, ?, 'processing')
        `).run(sessionId, totalAmount.toFixed(2) + ' TL', donationAmount.toFixed(2) + ' TL');

        // Add order items
        const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
        cartItems.forEach(item => {
            insertItem.run(orderResult.lastInsertRowid, item.product_id, item.quantity, item.price);
        });

        // Clear cart
        db.prepare('DELETE FROM cart WHERE session_id = ?').run(sessionId);

        res.json({
            success: true,
            orderId: orderResult.lastInsertRowid,
            totalAmount: totalAmount.toFixed(2) + ' TL',
            donationAmount: donationAmount.toFixed(2) + ' TL'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// DONATION STATS API
// =============================================

// Get donation statistics for session
app.get('/api/stats/:sessionId/donations', (req, res) => {
    try {
        // Get total donations from orders
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(donation_amount, '.', ''), ',', '.'), ' TL', '') AS REAL)), 0) as total_donation
            FROM orders 
            WHERE session_id = ?
        `).get(req.params.sessionId);

        // Count unique donation orgs
        const orgs = db.prepare(`
            SELECT COUNT(DISTINCT p.donation_org) as org_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.session_id = ?
        `).get(req.params.sessionId);

        res.json({
            totalDonation: (stats.total_donation || 0).toFixed(2) + ' TL',
            orderCount: stats.order_count || 0,
            orgCount: orgs.org_count || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ADDRESSES API
// =============================================

// Get user addresses
app.get('/api/addresses/:sessionId', (req, res) => {
    try {
        // For demo, return sample addresses
        res.json([
            {
                id: 1,
                title: 'Ev Adresi',
                fullAddress: 'Atatürk Cad. No:123 Daire:4',
                city: 'İstanbul',
                district: 'Kadıköy',
                postalCode: '34710',
                isDefault: true
            },
            {
                id: 2,
                title: 'İş Adresi',
                fullAddress: 'Büyükdere Cad. İş Merkezi Kat:5',
                city: 'İstanbul',
                district: 'Şişli',
                postalCode: '34394',
                isDefault: false
            }
        ]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// GLOBAL PLATFORM STATS API
// =============================================

// Get global platform statistics
app.get('/api/stats/global', (req, res) => {
    try {
        // Total donations from all orders
        const donationStats = db.prepare(`
            SELECT 
                COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(donation_amount, '.', ''), ',', '.'), ' TL', '') AS REAL)), 0) as total_donation
            FROM orders
        `).get();

        // Total orders count
        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();

        // Unique donation organizations
        const orgCount = db.prepare('SELECT COUNT(DISTINCT donation_org) as count FROM products').get();

        // Total products sold
        const productsSold = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM order_items').get();

        // Last donation info
        const lastOrder = db.prepare(`
            SELECT created_at, total_amount, donation_amount
            FROM orders 
            ORDER BY created_at DESC 
            LIMIT 1
        `).get();

        // Calculate time since last donation
        let lastDonationText = 'Henüz bağış yok';
        if (lastOrder) {
            const lastTime = new Date(lastOrder.created_at);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastTime) / (1000 * 60));

            if (diffMinutes < 1) {
                lastDonationText = 'Az önce';
            } else if (diffMinutes < 60) {
                lastDonationText = `${diffMinutes} dk önce`;
            } else if (diffMinutes < 1440) {
                lastDonationText = `${Math.floor(diffMinutes / 60)} saat önce`;
            } else {
                lastDonationText = `${Math.floor(diffMinutes / 1440)} gün önce`;
            }
        }

        // Format donation amount
        const totalDonation = donationStats.total_donation || 0;
        const formattedDonation = totalDonation.toLocaleString('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }) + ' TL';

        res.json({
            totalDonation: formattedDonation,
            totalDonationRaw: totalDonation,
            orderCount: orderCount.count || 0,
            orgCount: orgCount.count || 0,
            productsSold: productsSold.total || 0,
            lastDonation: lastDonationText
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ADMIN API
// =============================================

// Admin login
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);

        if (admin) {
            // Simple token (in production, use JWT)
            const token = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            res.json({
                success: true,
                token,
                admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
            });
        } else {
            res.status(401).json({ success: false, error: 'Geçersiz kullanıcı adı veya şifre' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin dashboard stats
app.get('/api/admin/dashboard', (req, res) => {
    try {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
        const totalDonation = db.prepare(`
            SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(donation_amount, '.', ''), ',', '.'), ' TL', '') AS REAL)), 0) as total
            FROM orders
        `).get();

        // Recent orders
        const recentOrders = db.prepare(`
            SELECT * FROM orders ORDER BY created_at DESC LIMIT 5
        `).all();

        // Recent users
        const recentUsers = db.prepare(`
            SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 5
        `).all();

        // Products low stock
        const lowStock = db.prepare('SELECT * FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 5').all();

        res.json({
            stats: {
                users: userCount.count,
                products: productCount.count,
                orders: orderCount.count,
                donations: totalDonation.total.toLocaleString('tr-TR') + ' TL'
            },
            recentOrders,
            recentUsers,
            lowStock
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users
app.get('/api/admin/users', (req, res) => {
    try {
        const users = db.prepare(`
            SELECT id, email, first_name, last_name, phone, is_blocked, created_at FROM users ORDER BY created_at DESC
        `).all();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Block/Unblock user
app.put('/api/admin/users/:id/block', (req, res) => {
    try {
        const { blocked } = req.body;
        db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(blocked ? 1 : 0, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all products for admin
app.get('/api/admin/products', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT p.*, mc.name as main_category, sc.name as sub_category 
            FROM products p
            LEFT JOIN main_categories mc ON p.main_category_id = mc.id
            LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
            ORDER BY p.id DESC
        `).all();

        const productsWithVariants = products.map(p => {
            const variants = db.prepare('SELECT type, value FROM product_variants WHERE product_id = ?').all(p.id);
            return {
                ...p,
                colors: variants.filter(v => v.type === 'color').map(v => v.value),
                sizes: variants.filter(v => v.type === 'size').map(v => v.value),
                memories: variants.filter(v => v.type === 'memory').map(v => v.value)
            };
        });

        res.json(productsWithVariants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add product
app.post('/api/admin/products', (req, res) => {
    try {
        const { name, price, oldPrice, image, description, mainCategory, subCategory, brand, stock, donationPercent, donationOrg, variants } = req.body;
        console.log('Received POST /admin/products:', req.body);

        // Resolve category IDs
        const mainCategoryId = getOrCreateMainCategory(mainCategory);
        const subCategoryId = getOrCreateSubCategory(subCategory, mainCategoryId);

        // Use transaction for product + variants
        const insertProduct = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO products (name, price, old_price, image, description, main_category_id, sub_category_id, brand, stock, donation_percent, donation_org)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(name, price, oldPrice || null, image, description, mainCategoryId, subCategoryId, brand, stock || 100, donationPercent || 15, donationOrg || 'LÖSEV');

            const productId = result.lastInsertRowid;

            // Insert SKU-based variants
            if (variants && Array.isArray(variants)) {
                const insertSkuVariant = db.prepare('INSERT INTO variants (product_id, sku, attributes, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)');
                variants.forEach((v, index) => {
                    const sku = v.sku || `${productId}-V${index + 1}`;
                    const attributes = typeof v.attributes === 'string' ? v.attributes : JSON.stringify(v.attributes);
                    insertSkuVariant.run(productId, sku, attributes, v.price || price, v.stock || 0, v.image || null);
                });
            }

            return productId;
        });

        const productId = insertProduct();
        res.json({ success: true, id: productId, productId: productId });
    } catch (error) {
        console.error('POST Product Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update product
app.put('/api/admin/products/:id', (req, res) => {
    try {
        const { name, price, oldPrice, image, description, mainCategory, subCategory, brand, stock, donationPercent, donationOrg, colors, sizes, memories } = req.body;
        console.log(`Received PUT /admin/products/${req.params.id}`, req.body);
        fs.writeFileSync('debug_variants.txt', `PUT Time: ${new Date().toISOString()}\nID: ${req.params.id}\nColors: ${JSON.stringify(colors)}\nSizes: ${JSON.stringify(sizes)}\nMemories: ${JSON.stringify(memories)}\n\n`, { flag: 'a' });
        const productId = req.params.id;

        // Resolve category IDs
        const mainCategoryId = getOrCreateMainCategory(mainCategory);
        const subCategoryId = getOrCreateSubCategory(subCategory, mainCategoryId);

        db.prepare(`
            UPDATE products SET name = ?, price = ?, old_price = ?, image = ?, description = ?, 
            main_category_id = ?, sub_category_id = ?, brand = ?, stock = ?, donation_percent = ?, donation_org = ?
            WHERE id = ?
        `).run(name, price, oldPrice || null, image, description, mainCategoryId, subCategoryId, brand, stock, donationPercent, donationOrg, productId);

        // Update variants - simple strategy: delete all and re-add
        db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
        const insertVariant = db.prepare('INSERT INTO product_variants (product_id, type, value, stock) VALUES (?, ?, ?, ?)');

        if (colors && Array.isArray(colors)) {
            colors.forEach(c => insertVariant.run(productId, 'color', c.trim(), 100));
        }
        if (sizes && Array.isArray(sizes)) {
            sizes.forEach(s => insertVariant.run(productId, 'size', s.trim(), 100));
        }
        if (memories && Array.isArray(memories)) {
            memories.forEach(m => insertVariant.run(productId, 'memory', m.trim(), 100));
        }

        res.json({ success: true });
    } catch (error) {
        console.error('PUT Error:', error);
        fs.writeFileSync('debug_error.txt', `Time: ${new Date().toISOString()}\nError: ${error.message}\nStack: ${error.stack}\n\n`, { flag: 'a' });
        res.status(500).json({ error: error.message });
    }
});

// Delete product
app.delete('/api/admin/products/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update stock
app.put('/api/admin/products/:id/stock', (req, res) => {
    try {
        const { stock } = req.body;
        db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(stock, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders for admin
app.get('/api/admin/orders', (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT o.*, GROUP_CONCAT(oi.product_id) as product_ids
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `).all();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
app.put('/api/admin/orders/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get donations (from orders)
app.get('/api/admin/donations', (req, res) => {
    try {
        const donations = db.prepare(`
            SELECT o.id, o.session_id, o.donation_amount, o.total_amount, o.created_at,
                   u.email, u.first_name, u.last_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.donation_amount IS NOT NULL
            ORDER BY o.created_at DESC
        `).all();

        const total = db.prepare(`
            SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(donation_amount, '.', ''), ',', '.'), ' TL', '') AS REAL)), 0) as total
            FROM orders
        `).get();

        res.json({ donations, total: total.total.toLocaleString('tr-TR') + ' TL' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║       Destifo Backend Server Started!          ║
╠════════════════════════════════════════════════╣
║  API:     http://localhost:${PORT}/api            ║
║  Static:  http://localhost:${PORT}                ║
╚════════════════════════════════════════════════╝
    `);
});
