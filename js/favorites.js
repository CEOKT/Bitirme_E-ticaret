// Favorites Management - Uses localStorage for persistence
const Favorites = {
    STORAGE_KEY: 'destifo_favorites',

    // Get all favorite product IDs
    getItems() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save favorites
    saveItems(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    },

    // Add to favorites
    add(productId) {
        const items = this.getItems();
        if (!items.includes(productId)) {
            items.push(productId);
            this.saveItems(items);
        }
        return true;
    },

    // Remove from favorites
    remove(productId) {
        let items = this.getItems();
        items = items.filter(id => id !== productId);
        this.saveItems(items);
    },

    // Toggle favorite status
    async toggle(productId) {
        if (window.FavoritesAPI) {
            try {
                const result = await window.FavoritesAPI.toggle(productId);
                return result.isFavorite;
            } catch (error) {
                console.warn('Favorites API not available, falling back to local');
            }
        }

        if (this.isFavorite(productId)) {
            this.remove(productId);
            return false;
        } else {
            this.add(productId);
            return true;
        }
    },

    // Check if product is in favorites
    isFavorite(productId) {
        return this.getItems().includes(productId);
    },

    // Get count
    getCount() {
        return this.getItems().length;
    },

    // Clear all favorites
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// Update favorite button states on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update favorite buttons if on product page
    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id')) || 1;

        if (Favorites.isFavorite(productId)) {
            favoriteBtn.classList.add('active');
            favoriteBtn.querySelector('i').style.color = '#e74c3c';
        }

        favoriteBtn.addEventListener('click', () => {
            const isFav = Favorites.toggle(productId);
            favoriteBtn.classList.toggle('active', isFav);
            favoriteBtn.querySelector('i').style.color = isFav ? '#e74c3c' : '';
        });
    }
});
