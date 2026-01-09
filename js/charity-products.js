/**
 * Charity Products Logic
 * Fetches normal products but repurposes them for donation to STKs
 */

let stks = [];
let selectedProductId = null;
let globalCharityProducts = [];

async function loadCharityProducts(containerId = 'charityGrid') {
    const grid = document.getElementById(containerId);
    if (!grid) return; // Guard if element doesn't exist

    // Find loading spinner (handle both ID conventions if needed, or rely on container structure)
    // For simplicity, we assume standard IDs based on page context or just hide standard ones
    const loadingMain = document.getElementById('loading-charity');
    // If we are on home page, maybe it uses same ID? Yes, duplicate ID issue in HTML if both visible?
    // No, index.html and campaigns.html are separate pages. 
    // BUT checking index.html earlier: id="loading-charity" was used in the new section.

    try {
        // Use dedicated charity products endpoint
        const response = await fetch(`${API_BASE}/products/charity`);
        if (!response.ok) throw new Error('Charity products fetch failed');

        const charityProducts = await response.json();

        console.log(`🔍 Charity products loaded: ${charityProducts.length}`);

        const displayProducts = charityProducts.slice(0, 24); // Limit to 24
        globalCharityProducts = displayProducts;

        if (loadingMain) loadingMain.style.display = 'none';

        grid.innerHTML = displayProducts.map(p => createCharityCard(p)).join('');

    } catch (error) {
        console.error('Charity Products Error:', error);
        if (loadingMain) loadingMain.textContent = 'Ürünler yüklenemedi.';
    }
}

function createCharityCard(p) {
    return `
        <div class="campaign-card visible">
             <div class="card-image-wrapper">
                <img src="${p.image}" alt="${p.name}">
                <div class="org-badge" style="background: rgba(46, 204, 113,0.9); color: white;">
                    <i class="fa-solid fa-gift"></i> İyilik Ürünü
                </div>
            </div>
            
            <div class="card-content">
                <h3 class="card-title">${p.name}</h3>
                <div class="price" style="font-size: 1.2rem; font-weight: 700; color: #2d3436; margin-bottom: 10px;">
                    ${p.price.toLocaleString('tr-TR')} TL
                </div>
                
                <p class="card-desc" style="margin-bottom: 20px;">
                    Bu ürünü satın alarak seçtiğiniz bir STK'ya bağışlayabilirsiniz.
                </p>

                <div class="card-actions">
                    <button class="donate-btn" onclick="openStkSelection(${p.id})">
                        <i class="fa-solid fa-hand-holding-heart"></i> BAĞIŞLA
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function openStkSelection(productId) {
    selectedProductId = productId;
    const product = globalCharityProducts.find(p => p.id === selectedProductId);

    if (!product) {
        console.error('Ürün bulunamadı:', productId);
        return;
    }

    // SMART CHECK: Kampanya ürünü mü?
    // Ürünün kategorisi 'Bagis_Kampanyasi' ise veya STK ID'si zaten tanımlıysa
    // Modal açmadan direkt o STK ile işleme devam et
    const isCampaignProduct =
        (product.main_category_id === 999) || // Eğer sabit ID varsa (değişken)
        (product.mainCategorySlug === 'bagis-kampanyasi') ||
        (product.category === 'Bagis_Kampanyasi') ||
        (product.donationPercent === 100) ||
        (product.stk_id && product.stk_id > 0);

    if (isCampaignProduct && product.stk_id) {
        console.log('Kampanya ürünü algılandı, STK seçimi atlanıyor:', product.donation_org);
        selectStkAndDonate(product.stk_id, product.donation_org || product.donationOrg || 'Kampanya Kurumu');
        return;
    }

    // Normal akış: Modal aç
    const modal = document.getElementById('stkModal');
    const list = document.getElementById('stkList');

    if (!modal || !list) return;

    modal.style.display = 'flex';
    list.innerHTML = '<p>Kurumlar yükleniyor...</p>';

    // Load STKs from new endpoint
    if (stks.length === 0) {
        try {
            const res = await fetch(`${API_BASE}/stk/approved-list`);
            const data = await res.json();
            if (data.success && data.stks) {
                stks = data.stks;
            } else {
                // Fallback to old endpoint
                const fallbackRes = await fetch(`${API_BASE}/stks`);
                stks = await fallbackRes.json();
            }
        } catch (e) {
            console.error('STK fetch error', e);
            list.innerHTML = '<p>Kurumlar yüklenemedi.</p>';
            return;
        }
    }

    if (stks.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #b2bec3;">Şu an onaylı STK bulunmamaktadır.</p>';
        return;
    }

    // Render STKs
    list.innerHTML = stks.map(stk => `
        <div class="stk-item" onclick="selectStkAndDonate(${stk.id || stk.user_id}, '${stk.organization_name}')" 
             style="padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.2s;">
            <div style="width: 40px; height: 40px; background: #f1f2f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-building-ngo" style="color: #6c5ce7;"></i>
            </div>
            <div>
                <div style="font-weight: 600; color: #2d3436;">${stk.organization_name}</div>
                <div style="font-size: 12px; color: #b2bec3;">${stk.description ? stk.description.substring(0, 50) + '...' : 'Onaylı STK Kuruluşu'}</div>
            </div>
        </div>
    `).join('');

    // Add CSS for hover effect dynamically (safe to add multiple times or check existence)
    if (!document.getElementById('stk-hover-style')) {
        const style = document.createElement('style');
        style.id = 'stk-hover-style';
        style.innerHTML = `.stk-item:hover { background-color: #f8f9fa; }`;
        document.head.appendChild(style);
    }
}

// Close STK Modal
function closeStkModal() {
    const modal = document.getElementById('stkModal');
    if (modal) modal.style.display = 'none';
}

// Expose to global scope for HTML onclick access
window.openStkSelection = openStkSelection;
window.closeStkModal = closeStkModal;
window.selectStkAndDonate = selectStkAndDonate;
window.loadCharityProducts = loadCharityProducts;

async function selectStkAndDonate(stkId, stkName) {
    closeStkModal();

    // Find product in global list
    const product = globalCharityProducts.find(p => p.id === selectedProductId);

    if (!product) {
        alert('Ürün bulunamadı');
        return;
    }

    // Redirect to payment page with donation parameters
    const params = new URLSearchParams({
        mode: 'donation',
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        stkId: stkId,
        stkName: stkName
    });

    window.location.href = `payment.html?${params.toString()}`;
}
