/**
 * Initialization script for European GenAI Hub
 * Handles DOM initialization, theme management, and mobile menu
 */
'use strict';

// Initialize Lucide icons and basic functionality
document.addEventListener("DOMContentLoaded", function () {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", (e) => {
            e.preventDefault();
            mobileMenu.classList.toggle("hidden");
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
        if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.add("hidden");
        }
    });

    // Dark mode toggle functionality
    const themeCheckbox = document.getElementById('theme-checkbox');
    const mobileThemeCheckbox = document.getElementById('mobile-theme-checkbox');
    const html = document.documentElement;

    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        
        // Sync both toggles
        if (themeCheckbox) {
            themeCheckbox.checked = theme === 'dark';
        }
        if (mobileThemeCheckbox) {
            mobileThemeCheckbox.checked = theme === 'dark';
        }
        
        // Add smooth transition
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
    }
    
    // Initialize theme
    applyTheme(savedTheme);

    // Theme toggle event listeners
    function handleThemeToggle() {
        const newTheme = this.checked ? 'dark' : 'light';
        
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
        
        // Re-create icons to ensure they display correctly
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', handleThemeToggle);
    }
    
    if (mobileThemeCheckbox) {
        mobileThemeCheckbox.addEventListener('change', handleThemeToggle);
    }

    // System theme detection
    if (window.matchMedia && !localStorage.getItem('theme')) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        applyTheme(systemTheme);
        
        // Listen for system theme changes
        mediaQuery.addEventListener('change', function(e) {
            if (!localStorage.getItem('theme')) {
                const newSystemTheme = e.matches ? 'dark' : 'light';
                applyTheme(newSystemTheme);
            }
        });
    }
    
    // Re-create icons after theme is applied
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Load featured initiatives
    loadFeaturedInitiatives();

    // Load research areas
    loadResearchAreas();

    // Load detailed content for sections
    loadDetailedFeaturedInitiatives();
    loadDetailedResearchAreas();
});
