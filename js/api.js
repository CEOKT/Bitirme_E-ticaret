// API Client for Destifo Backend
const API_BASE = 'http://localhost:3000/api';

// Session management
const SessionManager = {
    KEY: 'destifo_session_id',

    get() {
        let sessionId = localStorage.getItem(this.KEY);
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem(this.KEY, sessionId);
        }
        return sessionId;
    }
};

// Products API
const ProductsAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE}/products`);
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/products/${id}`);
        return response.json();
    },

    async getByCategory(category) {
        const response = await fetch(`${API_BASE}/products/category/${category}`);
        return response.json();
    }
};

// Cart API
const CartAPI = {
    async getItems() {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/cart/${sessionId}`);
        return response.json();
    },

    async addItem(productId, quantity = 1, selectedColor = null, selectedSize = null, selectedMemory = null, selectedAttributes = null) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, productId, quantity, selectedColor, selectedSize, selectedMemory, selectedAttributes })
        });
        const result = await response.json();
        this.updateCartCount();
        return result;
    },

    async updateQuantity(productId, quantity) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/cart/${sessionId}/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });
        this.updateCartCount();
        return response.json();
    },

    async removeItem(productId) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/cart/${sessionId}/${productId}`, {
            method: 'DELETE'
        });
        this.updateCartCount();
        return response.json();
    },

    async removeItemById(cartItemId) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/cart/${sessionId}/item/${cartItemId}`, {
            method: 'DELETE'
        });
        this.updateCartCount();
        return response.json();
    },

    async createOrder() {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
        const result = await response.json();
        if (result.success || result.id) { // Server returns id if success, or we check success flag if added
            this.updateCartCount();
        }
        return result;
    },

    async getCount() {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/cart/${sessionId}/count`);
        const data = await response.json();
        return data.count;
    },

    async updateCartCount() {
        const count = await this.getCount();
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }
};

// Favorites API
const FavoritesAPI = {
    async getItems() {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/favorites/${sessionId}`);
        return response.json();
    },

    async getIds() {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/favorites/${sessionId}/ids`);
        return response.json();
    },

    async add(productId) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, productId })
        });
        return response.json();
    },

    async remove(productId) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/favorites/${sessionId}/${productId}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    async toggle(productId) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/favorites/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, productId })
        });
        return response.json();
    },

    async isFavorite(productId) {
        const sessionId = SessionManager.get();
        const response = await fetch(`${API_BASE}/favorites/${sessionId}/check/${productId}`);
        const data = await response.json();
        return data.isFavorite;
    }
};

// Reviews API
const ReviewsAPI = {
    async getForProduct(productId) {
        const response = await fetch(`${API_BASE}/reviews/${productId}`);
        return response.json();
    },

    async add(productId, userName, rating, comment) {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, userName, rating, comment })
        });
        return response.json();
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize cart count
    try {
        await CartAPI.updateCartCount();
    } catch (error) {
        console.log('Backend not available, using localStorage fallback');
    }
});

// Export for global access
window.ProductsAPI = ProductsAPI;
window.CartAPI = CartAPI;
window.FavoritesAPI = FavoritesAPI;
window.ReviewsAPI = ReviewsAPI;
window.SessionManager = SessionManager;
