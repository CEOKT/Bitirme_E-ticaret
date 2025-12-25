document.addEventListener('DOMContentLoaded', async () => {
    const summaryItemsContainer = document.getElementById('summary-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDonation = document.getElementById('summary-donation');
    const summaryTotal = document.getElementById('summary-total');
    const completeOrderBtn = document.getElementById('complete-order-btn');
    const paymentForm = document.getElementById('payment-form');

    let cartItems = [];
    let isDonationMode = false;
    let donationInfo = null;
    let hasSavedAddress = false;
    let hasSavedCard = false;

    // Check if this is a donation payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('donation') === 'true') {
        isDonationMode = true;
        donationInfo = JSON.parse(localStorage.getItem('destifo_donation') || 'null');

        if (!donationInfo) {
            alert('Bağış bilgisi bulunamadı.');
            window.location.href = 'categories.html';
            return;
        }
    }

    // Input Masking & Validation Elements
    const cardNameInput = document.getElementById('card-name');
    const cardNumberInput = document.getElementById('card-number');
    const cardDateInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');
    const addressTitleInput = document.getElementById('address-title');
    const addressCityInput = document.getElementById('address-city');
    const addressDistrictInput = document.getElementById('address-district');
    const addressNeighborhoodInput = document.getElementById('address-neighborhood');
    const addressPostalInput = document.getElementById('address-postal');
    const addressStreetInput = document.getElementById('address-street');
    const addressBuildingInput = document.getElementById('address-building');
    const addressApartmentInput = document.getElementById('address-apartment');
    const addressNoteInput = document.getElementById('address-note');

    // Load saved addresses and cards
    async function loadSavedInfo() {
        const token = localStorage.getItem('destifo_token');
        if (!token) {
            console.log('No token - user not logged in, skipping saved info');
            return;
        }

        try {
            // Load saved addresses
            const addressResponse = await fetch('http://localhost:3000/api/user/addresses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Handle authentication errors gracefully
            if (addressResponse.status === 403 || addressResponse.status === 401) {
                console.log('Authentication failed - invalid or expired token');
                localStorage.removeItem('destifo_token');
                return;
            }

            if (addressResponse.ok) {
                const addresses = await addressResponse.json();
                console.log('Addresses loaded:', addresses);
                if (addresses.length > 0) {
                    hasSavedAddress = true;
                    const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
                    console.log('Default address:', defaultAddress);

                    // Create address selection UI
                    if (addressTitleInput && addressCityInput && !isDonationMode) {
                        console.log('Creating address UI...');
                        const addressContainer = addressTitleInput.closest('.form-group').parentElement;

                        // Add saved address selector before the form fields
                        const savedAddressHtml = `
                            <div class="saved-address-section" style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 10px; border: 2px solid #4caf50;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <i class="fa-solid fa-check-circle" style="color: #4caf50; font-size: 20px;"></i>
                                    <strong style="color: #2e7d32;">Kayıtlı Adresiniz</strong>
                                </div>
                                <select id="savedAddressSelect" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-bottom: 10px;">
                                    ${addresses.map(a => `<option value="${a.id}" ${a.is_default ? 'selected' : ''}>${a.title} - ${a.address.substring(0, 50)}...</option>`).join('')}
                                    <option value="new">+ Yeni Adres Ekle</option>
                                </select>
                            </div>
                        `;

                        // Check if already injected to avoid duplicates
                        if (!document.querySelector('.saved-address-section')) {
                            addressContainer.insertAdjacentHTML('afterbegin', savedAddressHtml);
                        }

                        // Fill default address immediately and make readonly
                        addressTitleInput.value = defaultAddress.title;
                        addressCityInput.value = defaultAddress.city || '';
                        addressDistrictInput.value = defaultAddress.district || '';
                        addressPostalInput.value = defaultAddress.postal_code || '';
                        // Fill detailed address fields
                        addressNeighborhoodInput.value = defaultAddress.neighborhood || '';
                        addressStreetInput.value = defaultAddress.street || '';
                        addressBuildingInput.value = defaultAddress.building_no || '';
                        addressApartmentInput.value = defaultAddress.apartment_no || '';
                        addressNoteInput.value = '';
                        console.log('Address fields filled:', addressTitleInput.value, defaultAddress.city);

                        // Make fields readonly
                        addressTitleInput.setAttribute('readonly', 'readonly');
                        addressCityInput.setAttribute('readonly', 'readonly');
                        addressDistrictInput.setAttribute('readonly', 'readonly');
                        addressPostalInput.setAttribute('readonly', 'readonly');
                        addressNeighborhoodInput.setAttribute('readonly', 'readonly');
                        addressStreetInput.setAttribute('readonly', 'readonly');
                        addressBuildingInput.setAttribute('readonly', 'readonly');
                        addressApartmentInput.setAttribute('readonly', 'readonly');
                        addressNoteInput.setAttribute('readonly', 'readonly');
                        addressTitleInput.style.backgroundColor = '#f5f5f5';
                        addressCityInput.style.backgroundColor = '#f5f5f5';

                        // Add edit button for address
                        const editAddressBtn = document.createElement('button');
                        editAddressBtn.type = 'button';
                        editAddressBtn.className = 'btn-secondary';
                        editAddressBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Düzenle';
                        editAddressBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; margin-right: 10px; background: #fff3e0; color: #e67e22; border: 1px solid #e67e22;';
                        editAddressBtn.onclick = () => {
                            // Enable fields for editing
                            const fields = [addressTitleInput, addressCityInput, addressDistrictInput, addressNeighborhoodInput, addressStreetInput, addressBuildingInput, addressApartmentInput, addressNoteInput];
                            fields.forEach(f => {
                                if (f) {
                                    f.removeAttribute('readonly');
                                    f.style.backgroundColor = '#fff';
                                }
                            });
                            addressTitleInput.focus();

                            // Show update button, hide edit button
                            editAddressBtn.style.display = 'none';
                            updateAddressBtn.style.display = 'inline-block';
                        };

                        const updateAddressBtn = document.createElement('button');
                        updateAddressBtn.type = 'button';
                        updateAddressBtn.className = 'btn-secondary';
                        updateAddressBtn.innerHTML = '<i class="fa-solid fa-save"></i> Güncelle';
                        updateAddressBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; margin-right: 10px; background: #e8f5e9; color: #2e7d32; border: 1px solid #2e7d32; display: none;';
                        updateAddressBtn.onclick = async () => {
                            const selectedId = document.getElementById('savedAddressSelect').value;
                            if (selectedId === 'new') return;

                            // Collect data
                            const updatedData = {
                                title: addressTitleInput.value,
                                city: addressCityInput.value,
                                district: addressDistrictInput.value,
                                neighborhood: addressNeighborhoodInput.value,
                                street: addressStreetInput.value,
                                building_no: addressBuildingInput.value,
                                apartment_no: addressApartmentInput.value,
                                postal_code: addressPostalInput.value,
                                address_note: addressNoteInput.value,
                                fullAddress: `${addressNeighborhoodInput.value}, ${addressStreetInput.value} No:${addressBuildingInput.value}/${addressApartmentInput.value} ${addressDistrictInput.value}/${addressCityInput.value}`
                            };

                            console.log('Updating address:', selectedId, updatedData);

                            try {
                                const res = await fetch(`http://localhost:3000/api/user/addresses/${selectedId}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify(updatedData)
                                });

                                if (res.ok) {
                                    alert('Adres güncellendi!');
                                    // Lock fields again
                                    const fields = [addressTitleInput, addressCityInput, addressDistrictInput, addressNeighborhoodInput, addressStreetInput, addressBuildingInput, addressApartmentInput, addressNoteInput];
                                    fields.forEach(f => {
                                        if (f) {
                                            f.setAttribute('readonly', 'readonly');
                                            f.style.backgroundColor = '#f5f5f5';
                                        }
                                    });
                                    // Reset buttons
                                    editAddressBtn.style.display = 'inline-block';
                                    updateAddressBtn.style.display = 'none';

                                    // Refresh list (optional, but good to show updated title in dropdown)
                                    // For now just keep going
                                } else {
                                    alert('Güncelleme başarısız!');
                                }
                            } catch (err) {
                                console.error(err);
                                alert('Hata oluştu');
                            }
                        };


                        // Add change button (Switch to new)
                        const changeAddressBtn = document.createElement('button');
                        changeAddressBtn.type = 'button';
                        changeAddressBtn.className = 'btn-secondary';
                        changeAddressBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Yeni Ekle';
                        changeAddressBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px;';
                        changeAddressBtn.onclick = () => {
                            document.getElementById('savedAddressSelect').value = 'new';
                            document.getElementById('savedAddressSelect').dispatchEvent(new Event('change'));
                        };

                        const addressSelectParent = document.querySelector('.saved-address-section');
                        if (addressSelectParent && !addressSelectParent.querySelector('.btn-secondary')) {
                            addressSelectParent.appendChild(editAddressBtn);
                            addressSelectParent.appendChild(updateAddressBtn);
                            addressSelectParent.appendChild(changeAddressBtn);
                        }

                        // Handle address selection change
                        document.getElementById('savedAddressSelect').addEventListener('change', (e) => {
                            if (e.target.value === 'new') {
                                addressTitleInput.value = '';
                                addressCityInput.value = '';
                                addressDistrictInput.value = '';
                                addressNeighborhoodInput.value = '';
                                addressPostalInput.value = '';
                                addressStreetInput.value = '';
                                addressBuildingInput.value = '';
                                addressApartmentInput.value = '';
                                addressNoteInput.value = '';
                                addressTitleInput.removeAttribute('readonly');
                                addressCityInput.removeAttribute('readonly');
                                addressDistrictInput.removeAttribute('readonly');
                                addressTitleInput.style.backgroundColor = '#fff';
                                addressCityInput.style.backgroundColor = '#fff';
                                addressDistrictInput.style.backgroundColor = '#fff';
                                addressTitleInput.focus();
                            } else {
                                const selected = addresses.find(a => a.id == e.target.value);
                                if (selected) {
                                    addressTitleInput.value = selected.title;
                                    addressCityInput.value = selected.city || '';
                                    addressDistrictInput.value = selected.district || '';
                                    addressPostalInput.value = selected.postal_code || '';
                                    addressNeighborhoodInput.value = selected.neighborhood || '';
                                    addressStreetInput.value = selected.street || '';
                                    addressBuildingInput.value = selected.building_no || '';
                                    addressApartmentInput.value = selected.apartment_no || '';
                                    addressNoteInput.value = '';

                                    // Make readonly
                                    addressTitleInput.setAttribute('readonly', 'readonly');
                                    addressCityInput.setAttribute('readonly', 'readonly');
                                    addressDistrictInput.setAttribute('readonly', 'readonly');
                                    addressPostalInput.setAttribute('readonly', 'readonly');
                                    addressNeighborhoodInput.setAttribute('readonly', 'readonly');
                                    addressStreetInput.setAttribute('readonly', 'readonly');
                                    addressBuildingInput.setAttribute('readonly', 'readonly');
                                    addressApartmentInput.setAttribute('readonly', 'readonly');
                                    addressNoteInput.setAttribute('readonly', 'readonly');
                                    addressTitleInput.style.backgroundColor = '#f5f5f5';
                                    addressCityInput.style.backgroundColor = '#f5f5f5';
                                    addressDistrictInput.style.backgroundColor = '#f5f5f5';
                                }
                            }
                        });
                    }
                }
            }

            // Load saved cards
            const cardResponse = await fetch('http://localhost:3000/api/user/cards', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Handle authentication errors gracefully
            if (cardResponse.status === 403 || cardResponse.status === 401) {
                console.log('Authentication failed for cards');
                return;
            }

            if (cardResponse.ok) {
                const cards = await cardResponse.json();
                console.log('Cards loaded:', cards);
                if (cards.length > 0) {
                    hasSavedCard = true;
                    const defaultCard = cards.find(c => c.is_default) || cards[0];
                    console.log('Default card:', defaultCard);

                    // Create card selection UI
                    const cardContainer = cardNameInput.closest('.form-group').parentElement;

                    const savedCardHtml = `
                        <div class="saved-card-section" style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 10px; border: 2px solid #2196f3;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <i class="fa-solid fa-credit-card" style="color: #2196f3; font-size: 20px;"></i>
                                <strong style="color: #1565c0;">Kayıtlı Kartınız</strong>
                            </div>
                            <select id="savedCardSelect" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;">
                                ${cards.map(c => `<option value="${c.id}" ${c.is_default ? 'selected' : ''}>${c.cardName} - ${c.cardNumberMasked ? c.cardNumberMasked.slice(-4) : ''}</option>`).join('')}
                                <option value="new">+ Yeni Kart Ekle</option>
                            </select>
                        </div>
                    `;

                    // Check if already injected
                    if (!document.querySelector('.saved-card-section')) {
                        cardContainer.insertAdjacentHTML('afterbegin', savedCardHtml);
                    }

                    // Fill default card info (masked) immediately and make readonly
                    // Fill default card info
                    cardNameInput.value = defaultCard.cardName;

                    if (defaultCard.cardNumber) {
                        // We have the full number!
                        console.log('Using full card number');
                        cardNumberInput.value = defaultCard.cardNumber;
                        // Trigger input event to format it
                        cardNumberInput.dispatchEvent(new Event('input'));
                    } else {
                        // Fallback to masked
                        cardNumberInput.placeholder = 'Kart Numarası (Tekrar Giriniz)';
                        cardNumberInput.value = '';
                    }

                    console.log('Card fields filled:', cardNameInput.value);
                    cardNumberInput.disabled = false; // Allow typing if needed (edit mode) or if masked

                    // If full number exists, make read-only initially
                    if (defaultCard.cardNumber) {
                        cardNumberInput.setAttribute('readonly', 'readonly');
                        cardNumberInput.style.backgroundColor = '#f5f5f5';
                    } else {
                        cardNumberInput.removeAttribute('readonly');
                        cardNumberInput.style.backgroundColor = '#fff';
                    }

                    cardDateInput.value = defaultCard.expiryDate || '';
                    cardNameInput.setAttribute('readonly', 'readonly');
                    cardDateInput.setAttribute('readonly', 'readonly');
                    cardNameInput.style.backgroundColor = '#f5f5f5';
                    cardDateInput.style.backgroundColor = '#f5f5f5';

                    // Add edit button for card
                    const editCardBtn = document.createElement('button');
                    editCardBtn.type = 'button';
                    editCardBtn.className = 'btn-secondary';
                    editCardBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Düzenle';
                    editCardBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; margin-right: 10px; background: #fff3e0; color: #e67e22; border: 1px solid #e67e22;';
                    editCardBtn.onclick = () => {
                        // Enable fields
                        cardNameInput.removeAttribute('readonly');
                        cardNameInput.style.backgroundColor = '#fff';
                        cardDateInput.removeAttribute('readonly');
                        cardDateInput.style.backgroundColor = '#fff';

                        // IMPORTANT: For card number, if we have it, we unlock it.
                        // If we don't (only masked), we clear it for re-entry.
                        if (cardNumberInput.value.includes('*')) {
                            cardNumberInput.value = '';
                        }
                        cardNumberInput.removeAttribute('readonly');
                        cardNumberInput.style.backgroundColor = '#fff';
                        cardNumberInput.focus();

                        // Toggle buttons
                        editCardBtn.style.display = 'none';
                        updateCardBtn.style.display = 'inline-block';
                    };

                    const updateCardBtn = document.createElement('button');
                    updateCardBtn.type = 'button';
                    updateCardBtn.className = 'btn-secondary';
                    updateCardBtn.innerHTML = '<i class="fa-solid fa-save"></i> Güncelle';
                    updateCardBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; margin-right: 10px; background: #e8f5e9; color: #2e7d32; border: 1px solid #2e7d32; display: none;';
                    updateCardBtn.onclick = async () => {
                        const selectedId = document.getElementById('savedCardSelect').value;
                        if (selectedId === 'new') return;

                        const updatedData = {
                            cardName: cardNameInput.value,
                            cardNumber: cardNumberInput.value.replace(/\s/g, ''),
                            expiryDate: cardDateInput.value
                        };

                        try {
                            const res = await fetch(`http://localhost:3000/api/user/cards/${selectedId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(updatedData)
                            });

                            if (res.ok) {
                                alert('Kart bilgileri güncellendi.');
                                // Lock fields
                                cardNameInput.setAttribute('readonly', 'readonly');
                                cardNameInput.style.backgroundColor = '#f5f5f5';
                                cardDateInput.setAttribute('readonly', 'readonly');
                                cardDateInput.style.backgroundColor = '#f5f5f5';
                                cardNumberInput.setAttribute('readonly', 'readonly');
                                cardNumberInput.style.backgroundColor = '#f5f5f5';

                                editCardBtn.style.display = 'inline-block';
                                updateCardBtn.style.display = 'none';
                            } else {
                                alert('Güncelleme başarısız.');
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    };

                    const changeCardBtn = document.createElement('button');
                    changeCardBtn.type = 'button';
                    changeCardBtn.className = 'btn-secondary';
                    changeCardBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Yeni Ekle';
                    changeCardBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px;';
                    changeCardBtn.onclick = () => {
                        document.getElementById('savedCardSelect').value = 'new';
                        document.getElementById('savedCardSelect').dispatchEvent(new Event('change'));
                    };

                    const cardSelectParent = document.querySelector('.saved-card-section');
                    if (cardSelectParent && !cardSelectParent.querySelector('.btn-secondary')) {
                        cardSelectParent.appendChild(editCardBtn);
                        cardSelectParent.appendChild(updateCardBtn);
                        cardSelectParent.appendChild(changeCardBtn);
                    }

                    // Handle card selection change
                    document.getElementById('savedCardSelect').addEventListener('change', (e) => {
                        if (e.target.value === 'new') {
                            cardNameInput.value = '';
                            cardNumberInput.value = '';
                            cardNumberInput.disabled = false;
                            cardDateInput.value = '';
                            cardCvvInput.value = '';
                            cardNameInput.removeAttribute('readonly');
                            cardDateInput.removeAttribute('readonly');
                            cardNameInput.style.backgroundColor = '#fff';
                            cardNumberInput.style.backgroundColor = '#fff';
                            cardDateInput.style.backgroundColor = '#fff';
                            cardNameInput.focus();
                        } else {
                            const selected = cards.find(c => c.id == e.target.value);
                            if (selected) {
                                cardNameInput.value = selected.cardName;
                                // Do not fill masked number
                                cardNumberInput.placeholder = 'Kart Numarası (Tekrar Giriniz)';
                                cardNumberInput.value = '';
                                cardNumberInput.disabled = false;
                                cardDateInput.value = selected.expiryDate || '';
                                cardNameInput.setAttribute('readonly', 'readonly');
                                cardDateInput.setAttribute('readonly', 'readonly');
                                cardNameInput.style.backgroundColor = '#f5f5f5';
                                cardNumberInput.style.backgroundColor = '#fff';
                                cardDateInput.style.backgroundColor = '#f5f5f5';
                                cardNumberInput.focus();
                            }
                        }
                    });
                } else {
                    console.log('No cards found');
                }
            } else {
                console.log('Card response not OK:', cardResponse.status);
            }
        } catch (error) {
            console.error('Error loading saved info:', error);
        }
    }

    // Save new address
    async function saveNewAddress(title, address) {
        const token = localStorage.getItem('destifo_token');
        if (!token) return;

        try {
            await fetch('http://localhost:3000/api/user/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    fullAddress: address, // Map address to fullAddress for server
                    district: '',
                    city: '',
                    postalCode: '',
                    is_default: !hasSavedAddress
                })
            });
        } catch (error) {
            console.log('Error saving address:', error);
        }
    }

    // Save new card
    async function saveNewCard(cardHolder, cardNumber, expiry) {
        const token = localStorage.getItem('destifo_token');
        if (!token) return;

        try {
            await fetch('http://localhost:3000/api/user/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cardName: cardHolder,
                    cardNumber: cardNumber.replace(/\s/g, ''), // Send FULL number
                    expiryDate: expiry,
                    is_default: !hasSavedCard
                })
            });
        } catch (error) {
            console.log('Error saving card:', error);
        }
    }

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
        if (cardNumberInput.disabled) return;
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

    [cardNameInput, addressTitleInput, addressCityInput, addressDistrictInput, addressNeighborhoodInput, addressStreetInput, addressBuildingInput].forEach(input => {
        if (input) input.addEventListener('input', () => setError(input, false));
    });

    function validateForm() {
        let isValid = true;

        // Card Name
        if (cardNameInput.value.trim().length < 3) {
            console.log('Validation FAIL: cardName too short:', cardNameInput.value);
            setError(cardNameInput, true);
            isValid = false;
        }

        // Card Number (16 digits) - skip if using saved card
        if (!cardNumberInput.disabled) {
            const rawCardNum = cardNumberInput.value.replace(/\s/g, '');
            if (rawCardNum.length !== 16) {
                console.log('Validation FAIL: cardNumber not 16 digits:', rawCardNum.length);
                setError(cardNumberInput, true);
                isValid = false;
            }
        }

        // Date (MM/YY)
        const dateParts = cardDateInput.value.split('/');
        if (dateParts.length !== 2 || dateParts[0] < 1 || dateParts[0] > 12 || dateParts[1].length !== 2) {
            console.log('Validation FAIL: cardDate invalid:', cardDateInput.value);
            setError(cardDateInput, true);
            isValid = false;
        }

        // CVV
        if (cardCvvInput.value.length !== 3) {
            console.log('Validation FAIL: CVV not 3 digits:', cardCvvInput.value.length);
            setError(cardCvvInput, true);
            isValid = false;
        }

        // Address - only required for non-donation mode
        if (!isDonationMode) {
            if (addressTitleInput && addressTitleInput.value.trim() === '') {
                console.log('Validation FAIL: addressTitle empty');
                setError(addressTitleInput, true);
                isValid = false;
            }
            if (addressCityInput && addressCityInput.value.trim() === '') {
                console.log('Validation FAIL: addressCity empty');
                setError(addressCityInput, true);
                isValid = false;
            }
            if (addressDistrictInput && addressDistrictInput.value.trim() === '') {
                console.log('Validation FAIL: addressDistrict empty');
                setError(addressDistrictInput, true);
                isValid = false;
            }
            if (addressNeighborhoodInput && addressNeighborhoodInput.value.trim() === '') {
                console.log('Validation FAIL: addressNeighborhood empty');
                setError(addressNeighborhoodInput, true);
                isValid = false;
            }
            if (addressStreetInput && addressStreetInput.value.trim() === '') {
                console.log('Validation FAIL: addressStreet empty');
                setError(addressStreetInput, true);
                isValid = false;
            }
            if (addressBuildingInput && addressBuildingInput.value.trim() === '') {
                console.log('Validation FAIL: addressBuilding empty');
                setError(addressBuildingInput, true);
                isValid = false;
            }
        }

        return isValid;
    }

    // Load donation summary
    function loadDonationSummary() {
        if (!donationInfo) return;

        const amount = donationInfo.amount;
        const org = donationInfo.organization;

        summaryItemsContainer.innerHTML = `
            <div class="summary-item" style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--secondary-color), #f39c12); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-heart" style="font-size: 24px; color: white;"></i>
                </div>
                <div class="summary-item-details">
                    <div class="summary-item-title" style="font-weight: 600;">Doğrudan Bağış</div>
                    <div style="color: #666; font-size: 14px;">${org}</div>
                </div>
            </div>
        `;

        summarySubtotal.textContent = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
        summaryDonation.textContent = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
        summaryTotal.textContent = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';

        // Update button text
        completeOrderBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Bağışı Tamamla';

        // Hide address section for donations
        const addressSection = document.querySelector('.address-section-container');
        if (addressSection) {
            addressSection.style.display = 'none';
        } else {
            // Fallback selector if container class not found
            const addressTitle = document.querySelector('h3.payment-title');
            if (addressTitle && addressTitle.innerText.includes('Adres')) {
                addressTitle.style.display = 'none';
                // Hide form group container
                const addressForm = addressTitle.nextElementSibling;
                if (addressForm) addressForm.style.display = 'none';
            }

            // Hide specific inputs container
            const addressFormContainer = document.querySelector('.address-form-container');
            if (addressFormContainer) addressFormContainer.style.display = 'none';
        }

        // Also hide via input parents to be sure
        if (addressTitleInput) {
            const formSection = addressTitleInput.closest('.payment-section') || addressTitleInput.closest('.col-md-6')?.parentElement;
            if (formSection) formSection.style.display = 'none';
        }

        // Update page title
        const pageTitle = document.querySelector('.payment-title');
        if (pageTitle) pageTitle.textContent = 'Bağış Ödeme Bilgileri';
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

    // Handle Order Completion - ROBUST VERSION
    completeOrderBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('=== ÖDEME İŞLEMİ BAŞLADI ===');
        console.log('1. Form doğrulaması yapılıyor...');

        // Custom validation
        if (!validateForm()) {
            console.log('❌ Form doğrulaması başarısız!');
            completeOrderBtn.classList.add('shake');
            setTimeout(() => completeOrderBtn.classList.remove('shake'), 500);
            return;
        }
        console.log('✓ Form doğrulaması başarılı');

        // Store original button text for recovery
        const originalButtonText = isDonationMode ? 'Bağışı Tamamla' : 'Siparişi Tamamla';

        // Prevent leaving page during processing
        const preventLeave = (e) => {
            e.preventDefault();
            e.returnValue = 'Sipariş işleniyor, sayfadan ayrılmak istediğinize emin misiniz?';
            return e.returnValue;
        };

        try {
            // Disable button and show loading
            completeOrderBtn.disabled = true;
            completeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
            window.addEventListener('beforeunload', preventLeave);
            console.log('2. Buton devre dışı bırakıldı, işlem başlıyor...');

            // ---------------------------------------------------------
            // UNIFIED PAYMENT FLOW (Products & Donations)
            // ---------------------------------------------------------

            // Get token
            const token = localStorage.getItem('destifo_token');
            if (!token) {
                throw new Error('Lütfen giriş yapın');
            }

            // Common Card Details
            const cardHolderName = cardNameInput.value.trim();
            const cardNumber = cardNumberInput.value.replace(/\s/g, '');
            const cvc = cardCvvInput.value.trim();
            const expiryParts = cardDateInput.value.split('/');
            const expireMonth = expiryParts[0] || '';
            const expireYear = expiryParts[1] ? '20' + expiryParts[1] : '';
            const registerCardCheckbox = document.getElementById('register-card');
            const registerCard = registerCardCheckbox && registerCardCheckbox.checked ? 1 : 0;

            console.log('3. Kart bilgileri hazırlandı');

            // Variables to be set based on mode
            let basketItems = [];
            let shippingAddress = {};
            let totalPrice = 0;
            let paidPrice = 0;
            let donationAmount = 0;

            if (isDonationMode) {
                console.log('4. Mod: BAĞIŞ');

                // Donation Mode Setup
                totalPrice = donationInfo.amount;
                paidPrice = donationInfo.amount;
                donationAmount = donationInfo.amount; // 100% is donation

                // Create virtual basket item
                basketItems = [{
                    id: 'DON-' + Date.now(),
                    name: `Bağış: ${donationInfo.organization}`,
                    category: 'Donation',
                    isDonation: true,
                    itemType: 'VIRTUAL',
                    price: totalPrice.toFixed(2),
                    quantity: 1
                }];

                // Dummy address for Iyzico (Required field)
                shippingAddress = {
                    title: 'Bağış',
                    city: 'Istanbul',
                    district: 'Merkez',
                    fullAddress: 'Dijital Bağış İşlemi - Fiziki Teslimat Yoktur'
                };

            } else {
                console.log('4. Mod: NORMAL SİPARİŞ');

                // Normal Cart Setup
                console.log('   Sepet öğeleri alınıyor...');
                const cartItems = window.CartAPI ? await window.CartAPI.getItems() : [];

                if (cartItems.length === 0) {
                    throw new Error('Sepetiniz boş');
                }

                // Calculate totals
                const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                // In normal flow, donation is 5% of subtotal (added on top or included? Based on logic: totalPrice = subtotal + donation)
                // Assuming previous logic: totalPrice = subtotal + donationAmount
                const calculatedDonation = subtotal * 0.05;

                totalPrice = subtotal + calculatedDonation;
                paidPrice = totalPrice;
                donationAmount = calculatedDonation;

                console.log('   Tutarlar: Ara=' + subtotal + ', Toplam=' + totalPrice);

                // Build basket items
                basketItems = cartItems.map(item => ({
                    id: item.product_id?.toString() || item.id?.toString(),
                    productId: item.product_id || item.id,
                    variantId: item.variant_id,
                    name: item.title || item.name || item.product_name || 'Ürün',
                    category: item.brand || 'Genel',
                    price: (item.price * item.quantity).toFixed(2),
                    quantity: item.quantity,
                    variantInfo: item.variant_info
                }));

                // Get address from form inputs
                shippingAddress = {
                    title: addressTitleInput ? addressTitleInput.value : '',
                    city: addressCityInput ? addressCityInput.value : '',
                    district: addressDistrictInput ? addressDistrictInput.value : '',
                    fullAddress: `${addressNeighborhoodInput?.value || ''}, ${addressStreetInput?.value || ''} No:${addressBuildingInput?.value || ''}${addressApartmentInput?.value ? '/' + addressApartmentInput.value : ''} ${addressDistrictInput?.value || ''}/${addressCityInput?.value || ''}`
                };
            }

            console.log('5. Paylaod hazırlanıyor...');

            // Prepare request body
            // Prepare request body
            // Calculate base price (Iyzico 'price' parameter)
            // For donation: total amount
            // For products: total amount - donation amount
            const basePrice = isDonationMode ? totalPrice : (totalPrice - donationAmount);

            const requestBody = {
                cardHolderName: cardHolderName,
                cardNumber: cardNumber,
                expireMonth: expireMonth,
                expireYear: expireYear,
                cvc: cvc,
                registerCard: registerCard,
                price: basePrice.toFixed(2),
                paidPrice: totalPrice.toFixed(2),
                basketItems: basketItems,
                shippingAddress: shippingAddress,
                billingAddress: shippingAddress,
                donationAmount: donationAmount.toFixed(2),
                sessionId: window.SessionManager ? SessionManager.get() : localStorage.getItem('destifo_session_id')
            };

            // Call payment API
            const useTestMode = false; // false = real Iyzico, true = test endpoint
            const endpoint = useTestMode ? '/api/payment/test-checkout' : '/api/payment/checkout';
            console.log('10. API isteği gönderiliyor: ' + endpoint);
            console.log('    Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('11. API yanıtı alındı: HTTP ' + response.status);

            // Parse response
            let result;
            try {
                result = await response.json();
                console.log('12. Yanıt parse edildi:', result);
            } catch (parseError) {
                console.error('❌ Yanıt parse hatası:', parseError);
                throw new Error('Sunucu yanıtı okunamadı');
            }

            // Check result
            if (result.status === 'success') {
                console.log('✅ ÖDEME BAŞARILI! Sipariş No: ' + result.orderId);

                // Save card if requested
                if (registerCard === 1) {
                    console.log('Saving card info...');
                    await saveNewCard(cardHolderName, cardNumber, `${expireMonth}/${expireYear.slice(-2)}`);
                }

                // Remove leave prevention
                window.removeEventListener('beforeunload', preventLeave);

                // Clear local cart
                if (window.Cart) Cart.clear();

                // Show success modal instead of alert
                showSuccessModal(donationAmount, isDonationMode ? donationInfo.organization : 'Türk Eğitim Vakfı');
                return;
            } else {
                console.log('❌ ÖDEME BAŞARISIZ:', result.error || result.errorMessage);
                throw new Error(result.error || result.errorMessage || 'Ödeme başarısız oldu');
            }

        } catch (error) {
            // Handle all errors here
            console.error('❌ HATA YAKALANDI:', error.message);
            console.error('   Stack:', error.stack);
            alert('İşlem sırasında bir hata oluştu:\n\n' + error.message);
        } finally {
            // ALWAYS run this block - restore button state
            console.log('=== FINALLY BLOĞU ÇALIŞTI ===');
            window.removeEventListener('beforeunload', preventLeave);
            completeOrderBtn.disabled = false;
            completeOrderBtn.innerHTML = originalButtonText;
            console.log('✓ Buton eski haline döndürüldü');
        }
    });

    // Initialize - load saved info first
    await loadSavedInfo();

    // Then load summary based on mode
    if (isDonationMode) {
        loadDonationSummary();
    } else {
        loadCartSummary();
    }

    // Show Success Modal
    function showSuccessModal(amount, orgName) {
        const modal = document.getElementById('successModal');
        const amountEl = document.getElementById('modal-amount');
        const orgEl = document.getElementById('modal-org');
        const continueBtn = document.getElementById('modal-continue-btn');

        if (!modal) {
            // Fallback if modal missing
            alert('Bağışınız alındı! Teşekkürler.');
            window.location.href = 'account.html#orders';
            return;
        }

        // Set data
        amountEl.textContent = parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
        orgEl.textContent = orgName || 'Türk Eğitim Vakfı';

        // Show modal
        modal.classList.add('active');

        // Trigger Confetti
        launchConfetti();

        // Handle continue
        continueBtn.onclick = () => {
            window.location.href = 'account.html#orders';
        };
    }

    // Confetti Animation
    function launchConfetti() {
        if (typeof confetti === 'function') {
            const count = 200;
            const defaults = {
                origin: { y: 0.7 },
                zIndex: 2000 // Ensure confetti is on top of modal (z-index 1000)
            };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        } else {
            console.log('Confetti library not loaded');
        }
    }
});
