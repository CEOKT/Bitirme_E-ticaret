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
    const modal = document.getElementById('validationModal');
    const closeBtn = document.querySelector('.close-modal');

    // Close modal logic
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            let items = [];
            if (window.CartAPI) {
                try {
                    items = await window.CartAPI.getItems();
                } catch (e) {
                    items = Cart.getItems();
                }
            } else {
                items = Cart.getItems();
            }

            if (items.length === 0) {
                alert('Sepetiniz boş!');
                return;
            }

            const incompleteItems = [];
            console.log('Starting validation check (Dynamic Only) for items:', items);

            for (const item of items) {
                const productId = item.product_id || item.productId;
                try {
                    const product = await window.ProductsAPI.getById(productId);

                    // Dynamic checks ONLY (from 'variants' array)
                    // We extract all unique keys from attributes in variants
                    let requiredAttributes = new Set();
                    let attributeOptions = {}; // { 'Renk': ['Kırmızı', 'Mavi'], 'Kayış': ['Deri'] }

                    // Only process if SKU variants exist
                    if (product.variants && product.variants.length > 0) {
                        product.variants.forEach(v => {
                            if (v.attributes) {
                                const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
                                Object.keys(attrs).forEach(key => {
                                    // Collect ALL attributes, including Renk/Beden/Hafıza
                                    requiredAttributes.add(key);
                                    if (!attributeOptions[key]) attributeOptions[key] = new Set();
                                    attributeOptions[key].add(attrs[key]);
                                });
                            }
                        });
                    } else {
                        // Fallback for old products without SKU variants? 
                        // User said "remove old system", but if no variants exist, we shouldn't block checkout unless we strictly enforce it.
                        // Current assumption: If NO variants array, then no validation needed.
                    }

                    // Check which are missing
                    let missing = [];
                    const itemAttrs = item.selected_attributes || item.selectedAttributes || {};

                    // Also check if mapped legacy fields exist in the item, treating them as attributes for backward compatibility usage in frontend
                    // But usually itemAttrs should hold the truth for dynamic system

                    requiredAttributes.forEach(attr => {
                        // Check if present in JSON attributes
                        let isPresent = !!itemAttrs[attr];

                        // If not in JSON, maybe it was stored in legacy columns? 
                        // We map legacy columns to attributes if they match standard names
                        if (!isPresent) {
                            if (attr.toLowerCase() === 'renk' && (item.selected_color || item.selectedColor)) isPresent = true;
                            if (attr.toLowerCase() === 'beden' && (item.selected_size || item.selectedSize)) isPresent = true;
                            if (attr.toLowerCase() === 'hafıza' && (item.selected_memory || item.selectedMemory)) isPresent = true;
                        }

                        if (!isPresent) {
                            missing.push(attr);
                        }
                    });

                    if (missing.length > 0) {
                        incompleteItems.push({
                            item: item,
                            product: product,
                            missing: missing,
                            attributeOptions: attributeOptions
                        });
                    }
                } catch (e) {
                    console.error('Product fetching error', e);
                }
            }

            if (incompleteItems.length > 0) {
                showValidationModal(incompleteItems);
            } else {
                window.location.href = 'payment.html';
            }
        });
    }

    function showValidationModal(items) {
        const list = document.getElementById('validationList');
        list.innerHTML = '';

        // Store active data for checking
        // Map index -> { product, options... }
        window.validationItemsData = items;

        items.forEach((entry, index) => {
            const p = entry.product;
            const missing = entry.missing;
            const attrOptions = entry.attributeOptions;

            let optionsHtml = '';

            // Render ALL missing attributes dynamically
            missing.forEach(m => {
                const opts = Array.from(attrOptions[m] || []);
                opts.sort();
                if (opts.length > 0) {
                    optionsHtml += createOptionHtml(m, opts, index, formatId(m));
                }
            });

            // Info box for feedback
            const infoHtml = `
                <div id="variant-info-${index}" class="variant-info">
                    <div class="variant-price" id="v-price-${index}"></div>
                    <div class="variant-stock" id="v-stock-${index}"></div>
                </div>
            `;

            const itemHtml = `
                <div class="validation-item" data-index="${index}">
                    <div class="val-image">
                        <img src="${p.image}" alt="">
                    </div>
                    <div class="val-details">
                        <h4>${p.title}</h4>
                        <p class="missing-warning">Lütfen seçim yapınız: ${missing.join(', ')}</p>
                        ${optionsHtml}
                        ${infoHtml}
                    </div>
                </div>
            `;
            list.innerHTML += itemHtml;
        });

        // Add Save Button event
        const saveBtn = document.getElementById('saveVariantsBtn');
        saveBtn.onclick = async () => {
            console.log('Save button clicked');
            saveBtn.textContent = 'Kontrol Ediliyor...';
            try {
                let allValid = true;

                // Validate Selection Presence
                for (let i = 0; i < items.length; i++) {
                    const entry = items[i];
                    entry.missing.forEach(m => {
                        const id = `selected-${formatId(m)}-${i}`;
                        const el = document.getElementById(id);
                        if (!el || !el.value) allValid = false;
                    });
                }

                if (!allValid) {
                    console.log('Validation failed');
                    alert('Lütfen tüm seçenekleri tamamlayınız.');
                    saveBtn.textContent = 'Seçimleri Kaydet';
                    return;
                }

                // Validate Stock
                for (let i = 0; i < items.length; i++) {
                    const status = checkVariantStatus(i);
                    if (status.isOOS) {
                        alert(`"${items[i].product.title}" için seçilen varyant stokta yok!`);
                        saveBtn.textContent = 'Seçimleri Kaydet';
                        return;
                    }
                }
                console.log('All validations passed, saving...');

                saveBtn.textContent = 'Kaydediliyor...';

                // Process Save: Update Cart
                for (let i = 0; i < items.length; i++) {
                    const entry = items[i];

                    // Start with existing attributes
                    const newAttributes = { ...(entry.item.selected_attributes || entry.item.selectedAttributes || {}) };

                    // Add legacy ones if present to the map, to ensure we preserve full state
                    if (entry.item.selected_color) newAttributes['Renk'] = entry.item.selected_color;
                    if (entry.item.selected_size) newAttributes['Beden'] = entry.item.selected_size;

                    // Merge new selections
                    entry.missing.forEach(m => {
                        const val = document.getElementById(`selected-${formatId(m)}-${i}`).value;
                        newAttributes[m] = val;
                    });

                    if (window.CartAPI) {
                        // Use the correct cart item ID from the entry
                        const cartItemId = entry.item.id;

                        // Remove old cart item by its ID
                        await window.CartAPI.removeItemById(cartItemId);

                        // Add new (Server handles merging if identical exists)
                        await window.CartAPI.addItem(
                            entry.product.id,
                            entry.item.quantity,
                            null, // color 
                            null, // size
                            null, // memory
                            newAttributes
                        );
                    }
                }

                window.location.reload();
            } catch (e) {
                console.error('Error during save:', e);
                alert('Hata oluştu: ' + e.message);
                saveBtn.textContent = 'Seçimleri Kaydet';
            }
        };

        modal.style.display = 'flex';
    }

    function createOptionHtml(label, options, index, typeId) {
        return `
            <div class="validation-field">
                <label>${label} Seçin:</label>
                <div class="option-chips" id="options-${typeId}-${index}">
                    ${options.map(o => `<div class="chip" onclick="selectChipNew(this, '${typeId}', ${index})">${o}</div>`).join('')}
                </div>
                <input type="hidden" id="selected-${typeId}-${index}" onchange="checkVariantStatus(${index})">
            </div>
        `;
    }

    // Helper to make safe IDs for dynamic strings (e.g., "Kasa Çapı" -> "kasacapi")
    function formatId(str) {
        return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    // Global chip selector NEW
    window.selectChipNew = function (el, typeId, index) {
        const parent = el.parentElement;
        parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        const input = document.getElementById(`selected-${typeId}-${index}`);
        input.value = el.innerText;

        // Trigger status check
        checkVariantStatus(index);
    }

    window.checkVariantStatus = function (index) {
        const entry = window.validationItemsData[index];
        if (!entry) return { isOOS: false };

        const product = entry.product;
        const missing = entry.missing;

        // Gather current selections
        const currentSelection = {};

        // Existing
        if (entry.item.selected_attributes) Object.assign(currentSelection, entry.item.selected_attributes);
        if (entry.item.selected_color) currentSelection['Renk'] = entry.item.selected_color;
        if (entry.item.selected_size) currentSelection['Beden'] = entry.item.selected_size;

        // New
        let allSelected = true;
        missing.forEach(m => {
            const val = document.getElementById(`selected-${formatId(m)}-${index}`).value;
            if (val) currentSelection[m] = val;
            else allSelected = false;
        });

        if (!allSelected) {
            document.getElementById(`variant-info-${index}`).classList.remove('visible');
            return { isOOS: false }; // Not fully selected yet
        }

        // Find matching SKU
        if (!product.variants) return { isOOS: false };

        const match = product.variants.find(v => {
            const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
            // Check if all currentSelection keys match attrs
            for (const key in currentSelection) {
                // If the attribute logic is consistent, this works. 
                // Note: v.attributes might have extra keys, or currentSelection might have extra.
                // We typically match exact subset or exact match.
                // Let's check: if user selected "Renk: Kırmızı", variant must have "Renk: Kırmızı".
                if (attrs[key] && attrs[key] !== currentSelection[key]) return false;
            }
            return true;
        });

        const infoBox = document.getElementById(`variant-info-${index}`);
        const priceEl = document.getElementById(`v-price-${index}`);
        const stockEl = document.getElementById(`v-stock-${index}`);

        if (match) {
            infoBox.classList.add('visible');

            // Price Check
            let priceText = `${match.price.toLocaleString('tr-TR')} TL`;
            if (match.price !== product.price) {
                const diff = match.price - product.price;
                const sign = diff > 0 ? '+' : '';
                priceText += ` <span style="font-size:11px; color:#666">(${sign}${diff.toLocaleString('tr-TR')} TL)</span>`;
            }
            priceEl.innerHTML = priceText;

            // Stock Check
            if (match.stock > 0) {
                stockEl.innerHTML = `<span class="stock-in"><i class="fa-solid fa-check"></i> Stokta Var (${match.stock} adet)</span>`;
                return { isOOS: false };
            } else {
                stockEl.innerHTML = `<span class="stock-out"><i class="fa-solid fa-xmark"></i> Stokta Tükendi</span>`;
                return { isOOS: true };
            }
        } else {
            // Combination not found
            infoBox.classList.add('visible');
            priceEl.innerHTML = '-';
            stockEl.innerHTML = `<span class="stock-out">Bu seçenek kombinasyonu mevcut değil.</span>`;
            return { isOOS: true };
        }
    }

    // Global chip selector
    window.selectChip = function (el, type, index) {
        parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        document.getElementById(`selected-${type}-${index}`).value = el.innerText;
    }
});
