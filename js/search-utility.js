/**
 * Universal Search Utility for EU GenAI Hub
 * Centralized, modular search functionality for all pages
 */
'use strict';

class UniversalSearchManager {
    constructor() {
        this.debounceTimer = null;
        this.isDestroyed = false;
        this.searchCache = new Map();
        this.maxCacheSize = 50;
        this.activeFilters = {};
        this.dataSource = null;
        this.pageType = null;
        this.renderCallback = null;
    }

    /**
     * Initialize search for a specific page type with data and render callback
     */
    init(pageType, dataSource, renderCallback) {
        if (this.isDestroyed) return;
        
        // Prevent duplicate initialization
        if (this.pageType === pageType && this.dataSource === dataSource) {
            console.log(`Search already initialized for ${pageType}`);
            return;
        }
        
        this.pageType = pageType;
        this.dataSource = dataSource;
        this.renderCallback = renderCallback;
        
        // Clear existing listeners
        this.cleanup();
        
        // Setup search inputs and filters
        this.setupSearchInputs();
        this.setupFilters();
        
        console.log(`Search initialized for ${pageType}`);
    }

    /**
     * Setup search input listeners
     */
    setupSearchInputs() {
        const searchInput = document.getElementById(`${this.pageType}-search`);
        if (!searchInput) return;

        // Remove existing listeners
        searchInput.removeEventListener('input', this.boundHandleSearchInput);
        searchInput.removeEventListener('paste', this.boundHandleSearchPaste);
        
        // Bind handlers to maintain context
        this.boundHandleSearchInput = (e) => this.handleSearchInput(e);
        this.boundHandleSearchPaste = (e) => this.handleSearchPaste(e);
        
        // Add new listeners
        searchInput.addEventListener('input', this.boundHandleSearchInput);
        searchInput.addEventListener('paste', this.boundHandleSearchPaste);
    }

    /**
     * Setup filter listeners
     */
    setupFilters() {
        const filterSelects = document.querySelectorAll(`select[id*="${this.pageType}-filter"]`);
        
        filterSelects.forEach(select => {
            if (!select) return;
            
            // Remove existing listeners
            select.removeEventListener('change', this.boundHandleFilterChange);
            
            // Bind handler to maintain context
            this.boundHandleFilterChange = (e) => this.handleFilterChange(e);
            
            // Add new listener
            select.addEventListener('change', this.boundHandleFilterChange);
        });
    }

    /**
     * Handle search input with sanitization
     */
    handleSearchInput(e) {
        const value = this.sanitizeInput(e.target.value);
        if (value !== e.target.value) {
            e.target.value = value;
        }
        console.log(`Search input: "${value}" for page: ${this.pageType}`);
        this.performSearch();
    }

    /**
     * Handle paste events with sanitization
     */
    handleSearchPaste(e) {
        setTimeout(() => {
            const sanitized = this.sanitizeInput(e.target.value);
            if (sanitized !== e.target.value) {
                e.target.value = sanitized;
            }
            this.performSearch();
        }, 0);
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(e) {
        const selectedValue = e.target.value;
        const validOptions = Array.from(e.target.options).map(opt => opt.value);
        
        if (!validOptions.includes(selectedValue)) {
            e.target.value = 'all';
            return;
        }
        
        // Store filter state
        const filterType = this.getFilterType(e.target.id);
        if (!this.activeFilters[this.pageType]) {
            this.activeFilters[this.pageType] = {};
        }
        this.activeFilters[this.pageType][filterType] = selectedValue;
        
        console.log(`Filter changed: ${filterType} = ${selectedValue} for page: ${this.pageType}`);
        console.log('Active filters:', this.activeFilters[this.pageType]);
        
        this.performSearch();
    }

    /**
     * Perform search with debouncing
     */
    performSearch() {
        if (this.isDestroyed || !this.dataSource || !this.renderCallback) return;
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const searchInput = document.getElementById(`${this.pageType}-search`);
            const query = searchInput ? this.sanitizeInput(searchInput.value.trim()) : '';
            
            // Check cache first
            const cacheKey = this.getCacheKey(query, this.activeFilters[this.pageType] || {});
            if (this.searchCache.has(cacheKey)) {
                this.renderCallback(this.searchCache.get(cacheKey));
                return;
            }
            
            // Perform search and filtering
            let results = this.filterData(this.dataSource, query);
            console.log(`After text search: ${results.length} results`);
            
            results = this.applyFilters(results);
            console.log(`After filters: ${results.length} results`);
            
            // Cache results
            this.cacheResults(cacheKey, results);
            
            // Render results
            this.renderCallback(results);
        }, 300);
    }

    /**
     * Filter data based on search query
     */
    filterData(data, query) {
        if (!query || !Array.isArray(data)) return data;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return data.filter(item => {
            const searchFields = this.getSearchFields(item);
            const searchText = searchFields.join(' ').toLowerCase();
            
            return searchTerms.every(term => searchText.includes(term));
        });
    }

    /**
     * Apply active filters to results
     */
    applyFilters(data) {
        if (!this.activeFilters[this.pageType]) return data;
        
        const filters = this.activeFilters[this.pageType];
        
        return data.filter(item => {
            return Object.entries(filters).every(([filterType, filterValue]) => {
                if (filterValue === 'all') return true;
                
                return this.matchesFilter(item, filterType, filterValue);
            });
        });
    }

    /**
     * Get search fields for an item based on page type
     */
    getSearchFields(item) {
        const baseFields = [
            item.title || item.name || '',
            item.description || '',
            item.institution || '',
            item.country || '',
            item.city || ''
        ];

        const keywordFields = [
            ...(item.keywords || []),
            ...(item.research_areas || []),
            ...(item.authors || []),
            ...(item.tags || [])
        ];

        // Page-specific fields
        switch (this.pageType) {
            case 'institutions':
                return [
                    item.name || '',
                    item.description || '',
                    item.country || '',
                    item.city || '',
                    item.type || '',
                    item.focus || '',
                    ...(item.research_areas || [])
                ];
            case 'projects':
                return [
                    ...baseFields,
                    item.status || '',
                    item.funding || '',
                    ...keywordFields
                ];
            case 'resources':
                return [
                    ...baseFields,
                    item.type || '',
                    item.year || '',
                    ...keywordFields
                ];
            case 'models':
                return [
                    ...baseFields,
                    item.model_type || '',
                    item.parameters || '',
                    item.architecture || '',
                    ...keywordFields
                ];
            default:
                return [...baseFields, ...keywordFields];
        }
    }

    /**
     * Check if item matches filter
     */
    matchesFilter(item, filterType, filterValue) {
        switch (filterType) {
            case 'type':
                const itemType = (item.type || '').toLowerCase();
                const filterType = filterValue.toLowerCase();
                // Handle both exact matches and partial matches for type
                return itemType === filterType || 
                       (filterType === 'university' && itemType.includes('university')) ||
                       (filterType === 'research' && (itemType.includes('research') || itemType.includes('center'))) ||
                       (filterType === 'industry' && (itemType.includes('industry') || itemType.includes('company')));
            case 'country':
                return (item.country || '').toLowerCase() === filterValue.toLowerCase();
            case 'year':
                return (item.year || '').toString() === filterValue;
            case 'status':
                return (item.status || '').toLowerCase() === filterValue.toLowerCase();
            case 'access':
                return (item.access || '').toLowerCase() === filterValue.toLowerCase();
            default:
                console.log(`Unknown filter type: ${filterType}, value: ${filterValue}`);
                return true;
        }
    }

    /**
     * Get filter type from element ID
     */
    getFilterType(elementId) {
        const parts = elementId.split('-');
        return parts[parts.length - 1]; // Last part after dash
    }

    /**
     * Generate cache key
     */
    getCacheKey(query, filters) {
        return `${this.pageType}-${query}-${JSON.stringify(filters)}`;
    }

    /**
     * Cache search results
     */
    cacheResults(key, results) {
        if (this.searchCache.size >= this.maxCacheSize) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(key, results);
    }

    /**
     * Sanitize user input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .slice(0, 100) // Limit length
            .trim();
    }

    /**
     * Populate filter options dynamically
     */
    populateFilterOptions(filterId, options) {
        const select = document.getElementById(filterId);
        if (!select || !Array.isArray(options)) return;

        // Keep the "All" option
        const allOption = select.querySelector('option[value="all"]');
        select.innerHTML = '';
        if (allOption) {
            select.appendChild(allOption);
        }

        // Add unique options
        const uniqueOptions = [...new Set(options)].filter(opt => opt && opt !== 'all');
        uniqueOptions.sort().forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }

    /**
     * Reset search and filters
     */
    reset() {
        // Reset search input
        const searchInput = document.getElementById(`${this.pageType}-search`);
        if (searchInput) {
            searchInput.value = '';
        }

        // Reset filters
        const filterSelects = document.querySelectorAll(`select[id*="${this.pageType}-filter"]`);
        filterSelects.forEach(select => {
            select.value = 'all';
        });

        // Clear active filters
        this.activeFilters[this.pageType] = {};

        // Re-render with original data
        if (this.renderCallback && this.dataSource) {
            this.renderCallback(this.dataSource);
        }
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        if (this.boundHandleSearchInput) {
            const searchInput = document.getElementById(`${this.pageType}-search`);
            if (searchInput) {
                searchInput.removeEventListener('input', this.boundHandleSearchInput);
                searchInput.removeEventListener('paste', this.boundHandleSearchPaste);
            }
        }

        if (this.boundHandleFilterChange) {
            const filterSelects = document.querySelectorAll(`select[id*="${this.pageType}-filter"]`);
            filterSelects.forEach(select => {
                select.removeEventListener('change', this.boundHandleFilterChange);
            });
        }
    }

    /**
     * Destroy the search manager
     */
    destroy() {
        this.cleanup();
        this.isDestroyed = true;
        this.searchCache.clear();
        this.activeFilters = {};
        this.dataSource = null;
        this.renderCallback = null;
        
        clearTimeout(this.debounceTimer);
    }
}

// Global instance for use across pages
window.universalSearch = new UniversalSearchManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalSearchManager;
}