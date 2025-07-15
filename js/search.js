// Search functionality with security and performance improvements
'use strict';

class SearchManager {
    constructor() {
        this.debounceTimer = null;
        this.isDestroyed = false;
        this.searchCache = new Map();
        this.maxCacheSize = 50;
    }

    init() {
        if (this.isDestroyed) return;
        
        this.setupSearchInputs();
        this.setupFilters();
    }

    setupSearchInputs() {
        const searchInputs = document.querySelectorAll('input[type="text"][id*="search"]');
        
        searchInputs.forEach(input => {
            if (!input) return;
            
            // Sanitize input value on change
            input.addEventListener('input', (e) => {
                const value = this.sanitizeInput(e.target.value);
                if (value !== e.target.value) {
                    e.target.value = value;
                }
                this.handleSearch(e);
            });
            
            // Prevent XSS in search inputs
            input.addEventListener('paste', (e) => {
                setTimeout(() => {
                    const sanitized = this.sanitizeInput(e.target.value);
                    if (sanitized !== e.target.value) {
                        e.target.value = sanitized;
                    }
                }, 0);
            });
        });
    }

    setupFilters() {
        const filterSelects = document.querySelectorAll('select[id*="filter"]');
        
        filterSelects.forEach(select => {
            if (!select) return;
            
            select.addEventListener('change', (e) => {
                // Validate filter value against allowed options
                const selectedValue = e.target.value;
                const validOptions = Array.from(e.target.options).map(opt => opt.value);
                
                if (!validOptions.includes(selectedValue)) {
                    e.target.value = '';
                    return;
                }
                
                this.handleFilter(e);
            });
        });
    }

    handleSearch(event) {
        if (this.isDestroyed) return;
        
        const query = this.sanitizeInput(event.target.value.trim());
        const sectionType = this.getSectionTypeFromInput(event.target);
        
        // Debounce search for performance
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query, sectionType);
        }, 300);
    }

    handleFilter(event) {
        if (this.isDestroyed) return;
        
        const filterValue = event.target.value;
        const sectionType = this.getSectionTypeFromInput(event.target);
        
        this.performFilter(filterValue, sectionType);
    }

    performSearch(query, sectionType) {
        if (!window.euGenAIHub || !window.euGenAIHub.data) return;
        
        const cacheKey = `${sectionType}-${query}`;
        
        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            this.displayResults(this.searchCache.get(cacheKey), sectionType);
            return;
        }
        
        const data = window.euGenAIHub.data[sectionType];
        if (!data) return;
        
        const results = this.filterData(data, query);
        
        // Cache results
        this.cacheResults(cacheKey, results);
        this.displayResults(results, sectionType);
    }

    performFilter(filterValue, sectionType) {
        if (!window.euGenAIHub || !window.euGenAIHub.data) return;
        
        const data = window.euGenAIHub.data[sectionType];
        if (!data) return;
        
        const results = filterValue ? 
            data.filter(item => this.matchesFilter(item, filterValue)) : 
            data;
        
        this.displayResults(results, sectionType);
    }

    filterData(data, query) {
        if (!query) return data;
        
        const queryLower = query.toLowerCase();
        
        return data.filter(item => {
            const searchFields = this.getSearchFields(item);
            return searchFields.some(field => 
                field && field.toLowerCase().includes(queryLower)
            );
        });
    }

    getSearchFields(item) {
        // Extract searchable fields from different item types
        const fields = [];
        
        if (item.name) fields.push(item.name);
        if (item.title) fields.push(item.title);
        if (item.project_name) fields.push(item.project_name);
        if (item.description) fields.push(item.description);
        if (item.country) fields.push(item.country);
        if (item.type) fields.push(item.type);
        if (item.area) fields.push(item.area);
        if (item.status) fields.push(item.status);
        if (item.key_partners) fields.push(...item.key_partners);
        if (item.models_developed) fields.push(...item.models_developed);
        
        return fields.filter(field => typeof field === 'string');
    }

    matchesFilter(item, filterValue) {
        // Generic filter matching logic
        return Object.values(item).some(value => {
            if (Array.isArray(value)) {
                return value.includes(filterValue);
            }
            return value === filterValue;
        });
    }

    displayResults(results, sectionType) {
        // Update the data in the main app
        if (window.euGenAIHub) {
            const filteredData = { ...window.euGenAIHub.data };
            filteredData[sectionType] = results;
            
            // Re-render the section with filtered data
            switch(sectionType) {
                case 'institutions':
                    window.euGenAIHub.renderInstitutions(results);
                    break;
                case 'projects':
                    window.euGenAIHub.renderProjects(results);
                    break;
                case 'resources':
                    window.euGenAIHub.renderResources(results);
                    break;
                case 'models':
                    window.euGenAIHub.renderModels(results);
                    break;
                case 'news':
                    window.euGenAIHub.renderNews(results);
                    break;
            }
        }
    }

    getSectionTypeFromInput(input) {
        const id = input.id;
        if (id.includes('institutions')) return 'institutions';
        if (id.includes('projects')) return 'projects';
        if (id.includes('resources')) return 'resources';
        if (id.includes('models')) return 'models';
        if (id.includes('news')) return 'news';
        return 'institutions'; // default
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove potentially dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove HTML brackets
            .replace(/['"]/g, '') // Remove quotes
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim()
            .substring(0, 100); // Limit length
    }

    cacheResults(key, results) {
        // Implement LRU cache
        if (this.searchCache.size >= this.maxCacheSize) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(key, results);
    }

    destroy() {
        this.isDestroyed = true;
        clearTimeout(this.debounceTimer);
        this.searchCache.clear();
    }
}

// Initialize search manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.searchManager) {
        window.searchManager = new SearchManager();
        window.searchManager.init();
    }
});