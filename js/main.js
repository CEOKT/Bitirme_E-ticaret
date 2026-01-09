/**
 * main.js
 * Common UI logic for Desktop/Mobile navigation and Search
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // SEARCH FUNCTIONALITY
    // ==========================================
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-bar button');

    function performSearch() {
        const query = searchInput.value;
        if (query && query.trim()) {
            window.location.href = `category.html?search=${encodeURIComponent(query.trim())}`;
        }
    }

    if (searchInput) {
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        // Search on Button click
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                performSearch();
            });
        }
    }

    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;

    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('mobile-overlay');
        body.appendChild(overlay);
    }

    if (mobileMenuBtn && navMenu) {
        function toggleMenu() {
            navMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            // Prevent scrolling when menu is open
            if (navMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        }

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close on overlay click
        overlay.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) toggleMenu();
        });

        // Close on link click (optional, good for UX)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) toggleMenu();
            });
        });
    }

    // ==========================================
    // DROPDOWN MOBILE SUPPORT (Optional)
    // ==========================================
    // Allow clicking parent items in mobile to toggle submenus
    if (window.innerWidth <= 992) {
        const dropdownToggles = document.querySelectorAll('.nav-item > a');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                // If it has a next sibling which is a dropdown-menu
                const nextEl = toggle.nextElementSibling;
                if (nextEl && nextEl.classList.contains('dropdown-menu')) {
                    e.preventDefault(); // Prevent navigation
                    toggle.parentElement.classList.toggle('open');
                }
            });
        });
    }
});
