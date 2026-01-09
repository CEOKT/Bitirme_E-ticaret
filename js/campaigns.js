/**
 * Campaigns Page Logic
 * Fetches real fundraising campaigns and renders premium UI cards
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Check if Cart API is available
    if (window.CartAPI) {
        try {
            await CartAPI.updateCartCount();
        } catch (e) {
            console.log('Cart offline mode');
        }
    }

    // Load Campaigns
    if (document.getElementById('campaignsGrid')) {
        await loadCampaigns();
    }
});

async function loadCampaigns(containerId = 'campaignsGrid') {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    const loading = document.getElementById('loading');

    // Show loading
    if (loading) loading.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/campaigns`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const campaigns = await response.json();

        // Hide loading
        if (loading) loading.style.display = 'none';

        if (!campaigns || campaigns.length === 0) {
            grid.innerHTML = `
                <div class="no-campaigns">
                    <i class="fa-solid fa-heart-crack"></i>
                    <p>Şu an aktif bir bağış kampanyası bulunmamaktadır.</p>
                </div>
            `;
            return;
        }

        // Render Cards
        grid.innerHTML = campaigns.map(c => createCampaignCard(c)).join('');

        // Apply animations
        setTimeout(() => {
            const cards = document.querySelectorAll('.campaign-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 100);
            });
        }, 100);

    } catch (error) {
        console.error('Campaigns Load Error:', error);
        if (loading) loading.style.display = 'none';
        grid.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-wifi"></i>
                <p>Kampanyalar yüklenirken bir hata oluştu.</p>
                <button onclick="loadCampaigns()" class="retry-btn">Tekrar Dene</button>
            </div>
        `;
    }
}

function createCampaignCard(c) {
    // Calculate percentage for progress bar (cap at 100%)
    const percent = Math.min(100, Math.round((c.current_amount / c.target_amount) * 100));
    const isUrgent = percent >= 80;

    return `
        <div class="campaign-card" onclick="window.location.href='campaign-details.html?id=${c.id}'" style="cursor: pointer;">
            <div class="card-image-wrapper">
                <img src="${c.image || 'images/placeholder-campaign.jpg'}" alt="${c.title}" onerror="this.src='images/placeholder-campaign.jpg'">
                <div class="org-badge">
                    <i class="fa-solid fa-hand-holding-heart"></i> ${c.organization_name || 'Destifo STK'}
                </div>
                ${isUrgent ? `<div class="urgent-badge"><i class="fa-solid fa-fire"></i> ACİL DESTEK</div>` : ''}
            </div>
            
            <div class="card-content">
                <h3 class="card-title">${c.title}</h3>
                <p class="card-desc">${c.description ? c.description.substring(0, 100) + '...' : ''}</p>
                
                <div class="progress-section">
                    <div class="progress-info">
                        <span class="raised">
                            <i class="fa-solid fa-wallet"></i>
                            ${(c.current_amount || 0).toLocaleString('tr-TR')} TL
                        </span>
                        <span class="percentage">%${percent}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="target-info">
                        Hedef: ${(c.target_amount || 0).toLocaleString('tr-TR')} TL
                    </div>
                </div>

                <div class="card-actions">
                    <button class="donate-btn" onclick="event.stopPropagation(); window.location.href='campaign-details.html?id=${c.id}'" style="position: relative; z-index: 2;">
                        <i class="fa-solid fa-heart"></i> DESTEK OL
                    </button>
                    <button class="share-btn" onclick="event.stopPropagation(); shareCampaign('${c.title}')" style="position: relative; z-index: 2;">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Global functions for buttons
window.shareCampaign = function (title) {
    if (navigator.share) {
        navigator.share({
            title: 'Destifo Bağış Kampanyası',
            text: `Bu anlamlı kampanyaya destek ol: ${title}`,
            url: window.location.href
        });
    } else {
        alert('Kampanya linki kopyalandı!');
    }
}

