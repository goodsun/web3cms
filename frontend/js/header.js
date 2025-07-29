// Common header component
function createHeader() {
    const headerHTML = `
        <header class="main-header">
            <div class="header-container">
                <a href="index.html" class="logo">Web3CMS</a>
                <nav class="main-nav">
                    <a href="index.html">Home</a>
                    <a href="settings.html">Settings</a>
                </nav>
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <nav class="mobile-nav" id="mobileNav">
                <a href="index.html">Home</a>
                <a href="settings.html">Settings</a>
            </nav>
        </header>
    `;
    
    // Find the insertion point
    const pageWrapper = document.querySelector('.page-wrapper');
    if (pageWrapper) {
        pageWrapper.insertAdjacentHTML('afterbegin', headerHTML);
    }
}

// Initialize header functionality
function initializeHeader() {
    // Create header first
    createHeader();
    
    // Then initialize mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !mobileNav.contains(e.target)) {
                menuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
            }
        });
    }
}

// Initialize header when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
} else {
    initializeHeader();
}