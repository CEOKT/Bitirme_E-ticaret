/**
 * Product Details Page - Variant Selection System
 * Handles dynamic variant rendering, price/stock updates, and cart integration
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Fetch product from API
        const response = await fetch(`${API_BASE}/products/${productId}`);
        if (!response.ok) {
            throw new Error('Ürün bulunamadı');
        }
        const product = await response.json();

        // Render basic product info
        renderProductInfo(product);

        // Initialize variant system
        initializeVariantSystem(product);

        // Setup cart buttons
        setupCartButtons(product);

    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        alert('Ürün yüklenirken bir hata oluştu.');
    }
});

/**
 * Render basic product information
 */
function renderProductInfo(product) {
    // Page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = `${product.name || product.title} - Destifo`;

    // Breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name || product.title;

    // Main image
    const mainImage = document.getElementById('product-image-main');
    if (mainImage) mainImage.src = product.image;

    // Thumbnails
    const thumbnails = document.querySelectorAll('.thumb img');
    thumbnails.forEach(thumb => { thumb.src = product.image; });

    // Brand and title
    const brandEl = document.getElementById('product-brand');
    if (brandEl) brandEl.textContent = product.brand || '';

    const titleEl = document.getElementById('product-title');
    if (titleEl) titleEl.textContent = product.name || product.title;

    // Price (base price - will be updated when variant selected)
    updatePriceDisplay(product.price, product.oldPrice);

    // Rating
    const ratingEl = document.getElementById('product-rating-count');
    if (ratingEl) ratingEl.textContent = `(${product.rating || 0} Değerlendirme)`;

    // Description
    const descEl = document.getElementById('product-description');
    if (descEl) descEl.textContent = product.description || '';

    // Donation info
    const donationPercent = product.donationPercent || product.donation_percent || 15;
    const donationAmount = (product.price * donationPercent / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const donationInfo = document.querySelector('.donation-box p');
    if (donationInfo) {
        donationInfo.innerHTML = `Bu ürünün <strong>%${donationPercent}</strong>'i ihtiyaç sahiplerine destek olur.`;
    }

    // Features
    if (product.features) {
        const featuresGrid = document.getElementById('features-grid');
        if (featuresGrid) {
            featuresGrid.innerHTML = '';
            for (const [key, value] of Object.entries(product.features)) {
                const row = document.createElement('div');
                row.className = 'feature-row';
                row.innerHTML = `
                    <span class="feature-label">${key}</span>
                    <span class="feature-value">${value}</span>
                `;
                featuresGrid.appendChild(row);
            }
        }
    }
}

/**
 * Update price display
 */
function updatePriceDisplay(price, oldPrice) {
    const priceEl = document.getElementById('product-price');
    if (priceEl) {
        priceEl.textContent = `${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
    }

    const oldPriceEl = document.getElementById('product-old-price');
    if (oldPriceEl) {
        if (oldPrice && oldPrice > price) {
            oldPriceEl.textContent = `${oldPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
            oldPriceEl.style.display = 'inline';
        } else {
            oldPriceEl.style.display = 'none';
        }
    }
}

/**
 * Initialize variant selection system
 */
function initializeVariantSystem(product) {
    const container = document.getElementById('variants-container');
    const stockStatus = document.getElementById('stock-status');
    const addToCartBtn = document.querySelector('.add-cart-large');
    const buyNowBtn = document.querySelector('.buy-now-btn');

    // Check if product has variants
    if (!product.variants || product.variants.length === 0) {
        // No variants - show base stock
        updateStockDisplay(product.stock, stockStatus, addToCartBtn, buyNowBtn);
        return;
    }

    // Parse attributes (might be string or object)
    const variants = product.variants.map(v => ({
        ...v,
        attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes
    }));

    // Extract all unique attribute keys (e.g., "Renk", "Hafıza", "Beden")
    const attributeKeys = new Set();
    variants.forEach(v => {
        Object.keys(v.attributes).forEach(key => attributeKeys.add(key));
    });

    // Store user selections
    const selectedAttributes = {};
    let selectedVariant = null;

    // Build UI for each attribute group
    container.innerHTML = '';

    attributeKeys.forEach(attrKey => {
        // Get unique values for this attribute
        const uniqueValues = [...new Set(variants.map(v => v.attributes[attrKey]))].filter(v => v);

        if (uniqueValues.length === 0) return;

        // Create group container
        const group = document.createElement('div');
        group.className = 'variant-group';
        group.style.cssText = 'margin-bottom: 20px;';

        // Group header
        const header = document.createElement('div');
        header.className = 'variant-header';
        header.style.cssText = 'margin-bottom: 10px; font-weight: 600;';
        header.innerHTML = `${attrKey}: <span id="selected-${attrKey}" style="color: var(--primary-color, #e74c3c);">Seçiniz</span>`;
        group.appendChild(header);

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'variant-buttons';
        buttonsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px;';

        uniqueValues.forEach(value => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'variant-btn';
            btn.textContent = value;
            btn.dataset.attrKey = attrKey;
            btn.dataset.attrValue = value;
            btn.style.cssText = `
                padding: 10px 20px;
                border: 2px solid #ddd;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            `;

            // Hover effect
            btn.onmouseenter = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.borderColor = '#999';
                }
            };
            btn.onmouseleave = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.borderColor = '#ddd';
                }
            };

            // Click handler
            btn.onclick = () => {
                // Update selection
                selectedAttributes[attrKey] = value;

                // Update selected text
                const selectedSpan = document.getElementById(`selected-${attrKey}`);
                if (selectedSpan) selectedSpan.textContent = value;

                // Update button styles in this group
                buttonsContainer.querySelectorAll('.variant-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = '#ddd';
                    b.style.backgroundColor = 'white';
                    b.style.color = '#333';
                });
                btn.classList.add('active');
                btn.style.borderColor = 'var(--primary-color, #e74c3c)';
                btn.style.backgroundColor = 'var(--primary-color, #e74c3c)';
                btn.style.color = 'white';

                // Check if all attributes are selected
                const allSelected = [...attributeKeys].every(key => selectedAttributes[key]);

                if (allSelected) {
                    // Find matching variant
                    selectedVariant = variants.find(v => {
                        return Object.entries(selectedAttributes).every(([key, val]) => v.attributes[key] === val);
                    });

                    if (selectedVariant) {
                        // Update price
                        updatePriceDisplay(selectedVariant.price, product.oldPrice);

                        // Update stock
                        updateStockDisplay(selectedVariant.stock, stockStatus, addToCartBtn, buyNowBtn);

                        // Store variant ID on buttons for cart
                        if (addToCartBtn) addToCartBtn.dataset.variantId = selectedVariant.id;
                        if (buyNowBtn) buyNowBtn.dataset.variantId = selectedVariant.id;

                        // Update image if variant has custom image
                        if (selectedVariant.image) {
                            const mainImg = document.getElementById('product-image-main');
                            if (mainImg) mainImg.src = selectedVariant.image;
                        }
                    } else {
                        // No matching variant (invalid combination)
                        stockStatus.innerHTML = '<span style="color: #e74c3c;"><i class="fa-solid fa-xmark"></i> Bu kombinasyon mevcut değil</span>';
                        disableCartButtons(addToCartBtn, buyNowBtn);
                    }
                } else {
                    // Not all selected yet - hide stock info
                    stockStatus.innerHTML = '<span style="color: #888;">Lütfen tüm seçenekleri belirleyin</span>';
                    disableCartButtons(addToCartBtn, buyNowBtn);
                }
            };

            buttonsContainer.appendChild(btn);
        });

        group.appendChild(buttonsContainer);
        container.appendChild(group);
    });

    // Initial state - prompt user to select
    stockStatus.innerHTML = '<span style="color: #888;">Lütfen seçenekleri belirleyin</span>';
    disableCartButtons(addToCartBtn, buyNowBtn);
}

/**
 * Update stock display and button states
 */
function updateStockDisplay(stock, stockStatus, addToCartBtn, buyNowBtn) {
    if (stock > 0) {
        stockStatus.innerHTML = `<span style="color: #27ae60;"><i class="fa-solid fa-check"></i> Stokta ${stock} adet var</span>`;
        enableCartButtons(addToCartBtn, buyNowBtn);
    } else {
        stockStatus.innerHTML = `<span style="color: #e74c3c;"><i class="fa-solid fa-xmark"></i> Tükendi</span>`;
        disableCartButtons(addToCartBtn, buyNowBtn);
    }
}

/**
 * Disable cart buttons
 */
function disableCartButtons(addToCartBtn, buyNowBtn) {
    if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.style.opacity = '0.5';
        addToCartBtn.style.cursor = 'not-allowed';
    }
    if (buyNowBtn) {
        buyNowBtn.disabled = true;
        buyNowBtn.style.opacity = '0.5';
        buyNowBtn.style.cursor = 'not-allowed';
    }
}

/**
 * Enable cart buttons
 */
function enableCartButtons(addToCartBtn, buyNowBtn) {
    if (addToCartBtn) {
        addToCartBtn.disabled = false;
        addToCartBtn.style.opacity = '1';
        addToCartBtn.style.cursor = 'pointer';
    }
    if (buyNowBtn) {
        buyNowBtn.disabled = false;
        buyNowBtn.style.opacity = '1';
        buyNowBtn.style.cursor = 'pointer';
    }
}

/**
 * Setup cart button event listeners
 */
function setupCartButtons(product) {
    const addToCartBtn = document.querySelector('.add-cart-large');
    const buyNowBtn = document.querySelector('.buy-now-btn');

    // Add to Cart
    if (addToCartBtn) {
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

        newBtn.addEventListener('click', async () => {
            if (newBtn.disabled) return;

            const variantId = newBtn.dataset.variantId;

            try {
                // Add to cart via API
                if (window.CartAPI) {
                    await CartAPI.addItem(product.id, 1, null, null, null);
                }

                // Visual feedback
                const originalText = newBtn.innerHTML;
                newBtn.innerHTML = '<i class="fa-solid fa-check"></i> Eklendi!';
                newBtn.style.backgroundColor = '#27ae60';
                setTimeout(() => {
                    newBtn.innerHTML = originalText;
                    newBtn.style.backgroundColor = '';
                }, 1500);
            } catch (error) {
                console.error('Sepete ekleme hatası:', error);
                alert('Sepete eklerken bir hata oluştu.');
            }
        });
    }

    // Buy Now
    if (buyNowBtn) {
        const newBuyBtn = buyNowBtn.cloneNode(true);
        buyNowBtn.parentNode.replaceChild(newBuyBtn, buyNowBtn);

        newBuyBtn.addEventListener('click', async () => {
            if (newBuyBtn.disabled) return;

            try {
                if (window.CartAPI) {
                    await CartAPI.addItem(product.id, 1, null, null, null);
                }
                window.location.href = 'cart.html';
            } catch (error) {
                console.error('Hata:', error);
                alert('İşlem sırasında bir hata oluştu.');
            }
        });
    }
}
