document.addEventListener('DOMContentLoaded', async () => {
    const summaryItemsContainer = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDonation = document.getElementById('summary-donation');
    const summaryTotal = document.getElementById('summary-total');
    const completeOrderBtn = document.getElementById('complete-order-btn');
    const paymentForm = document.getElementById('payment-form');

    let cartItems = [];

    // Input Masking & Validation Elements
    const cardNameInput = paymentForm.querySelector('input[placeholder="Ad Soyad"]');
    const cardNumberInput = paymentForm.querySelector('input[placeholder="0000 0000 0000 0000"]');
    const cardDateInput = paymentForm.querySelector('input[placeholder="AA/YY"]');
    const cardCvvInput = paymentForm.querySelector('input[placeholder="123"]');
    const addressTitleInput = paymentForm.querySelector('input[placeholder="Ev, İş vb."]');
    const addressTextInput = paymentForm.querySelector('textarea');

    // Helper: Set error state
    function setError(input, isError) {
        if (isError) {
            input.style.borderColor = '#e74c3c';
            input.style.backgroundColor = '#fff5f5';
        } else {
            input.style.borderColor = '#ddd';
            input.style.backgroundColor = '#fff';
        }
    }

    // Input Masks
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formattedValue += ' ';
            formattedValue += value[i];
        }
        e.target.value = formattedValue.substring(0, 19);
        setError(cardNumberInput, false);
    });

    cardDateInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value.substring(0, 5);
        setError(cardDateInput, false);
    });

    cardCvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        setError(cardCvvInput, false);
    });

    [cardNameInput, addressTitleInput, addressTextInput].forEach(input => {
        input.addEventListener('input', () => setError(input, false));
    });

    function validateForm() {
        let isValid = true;

        // Card Name
        if (cardNameInput.value.trim().length < 3) {
            setError(cardNameInput, true);
            isValid = false;
        }

        // Card Number (16 digits)
        const rawCardNum = cardNumberInput.value.replace(/\s/g, '');
        if (rawCardNum.length !== 16) {
            setError(cardNumberInput, true);
            isValid = false;
        }

        // Date (MM/YY)
        const dateParts = cardDateInput.value.split('/');
        if (dateParts.length !== 2 || dateParts[0] < 1 || dateParts[0] > 12 || dateParts[1].length !== 2) {
            setError(cardDateInput, true);
            isValid = false;
        }

        // CVV
        if (cardCvvInput.value.length !== 3) {
            setError(cardCvvInput, true);
            isValid = false;
        }

        // Address
        if (addressTitleInput.value.trim() === '') {
            setError(addressTitleInput, true);
            isValid = false;
        }
        if (addressTextInput.value.trim().length < 10) {
            setError(addressTextInput, true);
            isValid = false;
        }

        return isValid;
    }

    // Load cart items
    async function loadCartSummary() {
        if (window.CartAPI) {
            try {
                cartItems = await window.CartAPI.getItems();
            } catch (e) {
                cartItems = Cart.getItems();
            }
        } else {
            cartItems = Cart.getItems();
        }

        if (cartItems.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        let subtotal = 0;
        let html = '';

        cartItems.forEach(item => {
            let product;
            if (item.product_id) { // API format
                product = {
                    id: item.product_id,
                    title: item.title,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity
                };
            } else { // Local format
                const p = products.find(p => p.id === item.productId);
                if (p) {
                    product = {
                        ...p,
                        quantity: item.quantity
                    };
                }
            }

            if (product) {
                let priceNum;
                let displayPrice;

                if (typeof product.price === 'number') {
                    priceNum = product.price;
                    displayPrice = priceNum.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
                } else {
                    priceNum = parseFloat(product.price.replace('.', '').replace(',', '.').replace(' TL', ''));
                    displayPrice = product.price;
                }

                subtotal += priceNum * product.quantity;

                html += `
                    <div class="summary-item">
                        <img src="${product.image}" alt="${product.title}">
                        <div class="summary-item-details">
                            <div class="summary-item-title">${product.title}</div>
                            <div class="summary-item-price">${displayPrice} x ${product.quantity}</div>
                        </div>
                    </div>
                `;
            }
        });

        summaryItemsContainer.innerHTML = html;

        const donation = subtotal * 0.15;

        summarySubtotal.textContent = subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
        summaryDonation.textContent = donation.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
        summaryTotal.textContent = subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
    }

    // Handle Order Completion
    completeOrderBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Custom validation
        if (!validateForm()) {
            // Shake button to indicate error
            completeOrderBtn.classList.add('shake');
            setTimeout(() => completeOrderBtn.classList.remove('shake'), 500);
            return;
        }

        completeOrderBtn.disabled = true;
        completeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';

        try {
            if (window.CartAPI) {
                // Use API
                const result = await window.CartAPI.createOrder();
                if (result.success) {
                    // Redirect to orders page or success page
                    alert('Siparişiniz başarıyla alındı!');
                    window.location.href = 'account.html';
                } else {
                    throw new Error(result.error || 'Sipariş oluşturulamadı');
                }
            } else {
                // Local simulation
                alert('Siparişiniz başarıyla alındı! (Demo)');
                Cart.clear();
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Order error:', error);
            alert('Sipariş oluşturulurken bir hata oluştu: ' + error.message);
            completeOrderBtn.disabled = false;
            completeOrderBtn.textContent = 'Siparişi Tamamla';
        }
    });

    loadCartSummary();
});
