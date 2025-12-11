// Cart Management - Uses localStorage for persistence
const Cart = {
    STORAGE_KEY: 'destifo_cart',

    // Get all cart items
    getItems() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save cart items
    saveItems(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        this.updateCartCount();
    },

    // Add item to cart
    async addItem(productId, quantity = 1) {
        if (window.CartAPI) {
            try {
                await window.CartAPI.addItem(productId, quantity);
                // Also save to local for redundancy/offline support if needed
                // For now, trust API or fallback
                return true;
            } catch (error) {
                console.warn('Cart API not available, falling back to local');
                // Fallback to local
            }
        }

        const items = this.getItems();
        const existingIndex = items.findIndex(item => item.productId === productId);

        if (existingIndex > -1) {
            items[existingIndex].quantity += quantity;
        } else {
            items.push({ productId, quantity });
        }

        this.saveItems(items);
        return true;
    },

    // Remove item from cart
    removeItem(productId) {
        let items = this.getItems();
        items = items.filter(item => item.productId !== productId);
        this.saveItems(items);
    },

    // Update item quantity
    updateQuantity(productId, quantity) {
        const items = this.getItems();
        const item = items.find(item => item.productId === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveItems(items);
        }
    },

    // Get total item count
    getCount() {
        const items = this.getItems();
        return items.reduce((total, item) => total + item.quantity, 0);
    },

    // Update cart count in header
    updateCartCount() {
        const countElements = document.querySelectorAll('.cart-count');
        const count = this.getCount();
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Clear entire cart
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartCount();
    }
};

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCartCount();

    // Wire up checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const items = Cart.getItems();
            // Also check API items if possible, but basic check:
            if (items.length > 0 || (window.CartAPI)) {
                window.location.href = 'payment.html';
            } else {
                alert('Sepetiniz boş!');
            }
        });
    }
});
