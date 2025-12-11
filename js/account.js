document.addEventListener('DOMContentLoaded', async () => {

    // Authorization Check
    const user = JSON.parse(localStorage.getItem('destifo_user'));
    const sessionId = SessionManager.get();

    if (!user) {
        document.getElementById('account-dashboard').style.display = 'none';
        document.getElementById('guest-view').style.display = 'block';
        return; // Stop execution of account logic
    }

    // Tab Switching Logic
    const tabs = document.querySelectorAll('.account-nav-item[data-tab]');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Activate current
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Modals
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(m => m.classList.remove('active'));
        });
    });

    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            modals.forEach(m => m.classList.remove('active'));
        }
    }

    // Load Data
    // sessionId is already defined at the top

    // 1. Profile
    async function loadProfile() {
        if (user) {
            document.querySelector('.user-info h3').textContent = user.firstName ? `${user.firstName} ${user.lastName}` : 'Hesabım';
            document.querySelector('.user-info p').textContent = user.email || '';

            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
        }
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Kaydediliyor...';

        try {
            await fetch(`${API_BASE}/users/${sessionId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value
                })
            });
            btn.textContent = 'Güncellendi!';
            btn.style.backgroundColor = '#2ecc71';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                loadProfile();
            }, 2000);
        } catch (e) {
            alert('Hata oluştu');
            btn.textContent = originalText;
        }
    });

    // 2. Orders
    async function loadOrders() {
        const list = document.getElementById('ordersList');
        try {
            const response = await fetch(`${API_BASE}/orders/${sessionId}`);
            const orders = await response.json();

            if (orders.length === 0) {
                list.innerHTML = '<p style="text-align:center; padding: 2rem;">Henüz siparişiniz yok.</p>';
                return;
            }

            list.innerHTML = orders.map(order => {
                const date = new Date(order.created_at).toLocaleDateString('tr-TR');
                const item = order.items[0]; // Show first item as preview

                return `
                    <div class="order-item">
                        <div class="order-image">
                            <img src="${item?.image || 'https://via.placeholder.com/100'}" alt="Ürün">
                        </div>
                        <div class="order-details">
                            <span class="order-id">#DST${order.id}</span>
                            <span class="order-date">${date}</span>
                            <span class="order-product">${item?.title || 'Ürün'} ${order.items.length > 1 ? `(+${order.items.length - 1} diğer)` : ''}</span>
                        </div>
                        <div class="order-status ${order.status}">
                            ${order.status.toUpperCase()}
                        </div>
                        <div class="order-price">${order.total_amount}</div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            list.innerHTML = '<p>Siparişler yüklenemedi.</p>';
        }
    }

    // 3. Addresses
    async function loadAddresses() {
        const list = document.getElementById('addressesList');
        try {
            const response = await fetch(`${API_BASE}/addresses/${sessionId}`);
            const data = await response.json();

            if (data.length === 0) {
                list.innerHTML = '<p>Kayıtlı adresiniz yok.</p>';
                return;
            }

            list.innerHTML = data.map(addr => `
                <div class="address-card ${addr.isDefault ? 'default' : ''}">
                    <h4>${addr.title} ${addr.isDefault ? '<span class="default-badge">Varsayılan</span>' : ''}</h4>
                    <p>${addr.fullAddress}</p>
                    <p>${addr.district} / ${addr.city}</p>
                    <div class="address-actions">
                         <button class="btn-delete" onclick="deleteAddress(${addr.id})" style="color: red; background: none; border: none; cursor: pointer;">Sil</button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            list.innerHTML = '<p>Adresler yüklenemedi.</p>';
        }
    }

    window.deleteAddress = async (id) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        await fetch(`${API_BASE}/addresses/${sessionId}/${id}`, { method: 'DELETE' });
        loadAddresses();
    };

    document.getElementById('addAddressBtn').addEventListener('click', () => {
        document.getElementById('addressModal').classList.add('active');
    });

    document.getElementById('addressForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.sessionId = sessionId;

        await fetch(`${API_BASE}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        document.getElementById('addressModal').classList.remove('active');
        e.target.reset();
        loadAddresses();
    });

    // 4. Cards
    async function loadCards() {
        const list = document.getElementById('cardsList');
        try {
            const response = await fetch(`${API_BASE}/cards/${sessionId}`);
            const data = await response.json();

            if (data.length === 0) {
                list.innerHTML = '<p>Kayıtlı kartınız yok.</p>';
                return;
            }

            list.innerHTML = data.map(card => `
                <div class="payment-card-item">
                    <h4>${card.cardName}</h4>
                    <p style="font-family: monospace; font-size: 1.2rem;">${card.cardNumberMasked}</p>
                    <p>${card.expiryDate}</p>
                    <div class="card-actions">
                         <button onclick="deleteCard(${card.id})" style="color: red; background: none; border: none; cursor: pointer;">Sil</button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            list.innerHTML = '<p>Kartlar yüklenemedi.</p>';
        }
    }

    window.deleteCard = async (id) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        await fetch(`${API_BASE}/cards/${sessionId}/${id}`, { method: 'DELETE' });
        loadCards();
    };

    document.getElementById('addCardBtn').addEventListener('click', () => {
        document.getElementById('cardModal').classList.add('active');
    });

    // Card formatting logic (reused from payment.js simplified)
    const cardInput = document.querySelector('input[name="cardNumber"]');
    cardInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formattedValue += ' ';
            formattedValue += value[i];
        }
        e.target.value = formattedValue.substring(0, 19);
    });

    const dateInput = document.querySelector('input[name="expiryDate"]');
    dateInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value.substring(0, 5);
    });

    document.getElementById('cardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.sessionId = sessionId;

        await fetch(`${API_BASE}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        document.getElementById('cardModal').classList.remove('active');
        e.target.reset();
        loadCards();
    });

    // 5. Donations
    async function loadDonationStats() {
        try {
            const response = await fetch(`${API_BASE}/stats/${sessionId}/donations`);
            const stats = await response.json();

            document.getElementById('totalDonation').textContent = stats.totalDonation;
            document.getElementById('orderCount').textContent = stats.orderCount;
            document.getElementById('orgCount').textContent = stats.orgCount;
        } catch (e) {
            console.error('Stats load error', e);
        }
    }

    // 6. Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Çıkış işlemine devam edilsin mi?')) {
            localStorage.removeItem('destifo_user');
            // Reload to show guest view
            window.location.reload();
        }
    });

    // Initialize
    await loadProfile();
    await loadOrders();
    await loadAddresses();
    await loadCards();
    await loadDonationStats();

    // Update cart
    if (window.CartAPI) {
        CartAPI.updateCartCount();
    }
});
