
// Enhanced Search functionality with comprehensive error handling
'use strict';

class SearchManager {
    constructor() {
        this.debounceTimer = null;
        this.isDestroyed = false;
        this.searchCache = new Map();
        this.maxCacheSize = 50;
        this.activeFilters = {};
    }

    init() {
        if (this.isDestroyed) return;
        
        this.setupSearchInputs();
        this.setupFilters();
        this.setupGlobalSearch();
    }

    setupSearchInputs() {
        const searchInputs = document.querySelectorAll('input[type="text"][id*="search"]');
        
        searchInputs.forEach(input => {
            if (!input) return;
            
            // Remove existing listeners to prevent duplicates
            input.removeEventListener('input', this.handleSearchInput);
            input.removeEventListener('paste', this.handleSearchPaste);
            
            // Add new listeners
            input.addEventListener('input', (e) => this.handleSearchInput(e));
            input.addEventListener('paste', (e) => this.handleSearchPaste(e));
        });
    }

    setupFilters() {
        const filterSelects = document.querySelectorAll('select[id*="filter"]');
        
        filterSelects.forEach(select => {
            if (!select) return;
            
            select.removeEventListener('change', this.handleFilterChange);
            select.addEventListener('change', (e) => this.handleFilterChange(e));
        });
    }

    setupGlobalSearch() {
        // Add global search functionality for standalone pages
        if (window.location.pathname.includes('/pages/')) {
            this.initStandalonePageSearch();
        }
    }

    initStandalonePageSearch() {
        const pageName = this.getPageNameFromUrl();
        if (!pageName) return;

        // Initialize search for specific page type
        setTimeout(() => {
            this.setupPageSpecificSearch(pageName);
        }, 500);
    }

    getPageNameFromUrl() {
        const path = window.location.pathname;
        if (path.includes('institutions')) return 'institutions';
        if (path.includes('projects')) return 'projects';
        if (path.includes('resources')) return 'resources';
        if (path.includes('models')) return 'models';
        return null;
    }

    setupPageSpecificSearch(pageType) {
        const searchInput = document.getElementById(`${pageType}-search`);
        const filters = document.querySelectorAll(`select[id*="${pageType}-filter"]`);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handlePageSearch(e, pageType);
            });
        }

        filters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                this.handlePageFilter(e, pageType);
            });
        });
    }

    handleSearchInput(e) {
        const value = this.sanitizeInput(e.target.value);
        if (value !== e.target.value) {
            e.target.value = value;
        }
        this.handleSearch(e);
    }

    handleSearchPaste(e) {
        setTimeout(() => {
            const sanitized = this.sanitizeInput(e.target.value);
            if (sanitized !== e.target.value) {
                e.target.value = sanitized;
            }
        }, 0);
    }

    handleFilterChange(e) {
        const selectedValue = e.target.value;
        const validOptions = Array.from(e.target.options).map(opt => opt.value);
        
        if (!validOptions.includes(selectedValue)) {
            e.target.value = 'all';
            return;
        }
        
        this.handleFilter(e);
    }

    handleSearch(event) {
        if (this.isDestroyed) return;
        
        const query = this.sanitizeInput(event.target.value.trim());
        const sectionType = this.getSectionTypeFromInput(event.target);
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query, sectionType);
        }, 300);
    }

    handleFilter(event) {
        if (this.isDestroyed) return;
        
        const filterValue = event.target.value;
        const sectionType = this.getSectionTypeFromInput(event.target);
        const filterType = this.getFilterTypeFromInput(event.target);
        
        // Store active filter
        if (!this.activeFilters[sectionType]) {
            this.activeFilters[sectionType] = {};
        }
        this.activeFilters[sectionType][filterType] = filterValue;
        
        this.performFilter(sectionType);
    }

    handlePageSearch(event, pageType) {
        const query = this.sanitizeInput(event.target.value.trim());
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performPageSearch(query, pageType);
        }, 300);
    }

    handlePageFilter(event, pageType) {
        const filterValue = event.target.value;
        const filterType = this.getFilterTypeFromInput(event.target);
        
        if (!this.activeFilters[pageType]) {
            this.activeFilters[pageType] = {};
        }
        this.activeFilters[pageType][filterType] = filterValue;
        
        this.performPageFilter(pageType);
    }

    performSearch(query, sectionType) {
        // Handle main app search
        if (window.euGenAIHub && window.euGenAIHub.data) {
            const data = window.euGenAIHub.data[sectionType];
            if (!data) return;
            
            const results = this.filterData(data, query);
            this.displayResults(results, sectionType);
        }
    }

    performFilter(sectionType) {
        // Handle main app filtering
        if (window.euGenAIHub && window.euGenAIHub.data) {
            const data = window.euGenAIHub.data[sectionType];
            if (!data) return;
            
            const searchInput = document.getElementById(`${sectionType}-search`);
            const searchQuery = searchInput ? searchInput.value.trim() : '';
            
            let results = this.filterData(data, searchQuery);
            results = this.applyFilters(results, sectionType);
            
            this.displayResults(results, sectionType);
        }
    }

    performPageSearch(query, pageType) {
        // Handle standalone page search
        const pageInstance = this.getPageInstance(pageType);
        if (pageInstance && pageInstance.data) {
            const results = this.filterData(pageInstance.data, query);
            this.displayPageResults(results, pageType, pageInstance);
        }
    }

    performPageFilter(pageType) {
        // Handle standalone page filtering
        const pageInstance = this.getPageInstance(pageType);
        if (pageInstance && pageInstance.data) {
            const searchInput = document.getElementById(`${pageType}-search`);
            const searchQuery = searchInput ? searchInput.value.trim() : '';
            
            let results = this.filterData(pageInstance.data, searchQuery);
            results = this.applyFilters(results, pageType);
            
            this.displayPageResults(results, pageType, pageInstance);
        }
    }

    getPageInstance(pageType) {
        // Get the page instance from global scope
        if (window.institutionsPage && pageType === 'institutions') return window.institutionsPage;
        if (window.projectsPage && pageType === 'projects') return window.projectsPage;
        if (window.resourcesPage && pageType === 'resources') return window.resourcesPage;
        return null;
    }

    filterData(data, query) {
        if (!query || !Array.isArray(data)) return data;
        
        const queryLower = query.toLowerCase();
        
        return data.filter(item => {
            const searchFields = this.getSearchFields(item);
            return searchFields.some(field => 
                field && field.toLowerCase().includes(queryLower)
            );
        });
    }

    applyFilters(data, sectionType) {
        const filters = this.activeFilters[sectionType];
        if (!filters) return data;
        
        return data.filter(item => {
            return Object.entries(filters).every(([filterType, filterValue]) => {
                if (filterValue === 'all') return true;
                
                switch (filterType) {
                    case 'country':
                        return item.country === filterValue;
                    case 'type':
                        return item.type === filterValue;
                    case 'status':
                        return item.status === filterValue;
                    case 'area':
                        return this.matchesArea(item, filterValue);
                    case 'year':
                        return item.year && item.year.toString() === filterValue;
                    case 'access':
                        return item.access_type === filterValue;
                    default:
                        return true;
                }
            });
        });
    }

    matchesArea(item, filterValue) {
        const areas = [
            ...(item.research_areas || []),
            ...(item.technologies || []),
            item.category
        ].filter(Boolean);
        
        return areas.some(area => 
            area.toLowerCase().includes(filterValue.toLowerCase()) ||
            filterValue.toLowerCase().includes(area.toLowerCase())
        );
    }

    getSearchFields(item) {
        const fields = [];
        
        // Basic fields
        ['name', 'title', 'project_name', 'description', 'country', 'city', 'type', 'area', 'status', 'institution', 'funding', 'category'].forEach(field => {
            if (item[field]) fields.push(item[field]);
        });
        
        // Array fields
        ['key_partners', 'models_developed', 'technologies', 'participants', 'keywords', 'research_areas', 'authors', 'languages'].forEach(field => {
            if (Array.isArray(item[field])) {
                fields.push(...item[field]);
            }
        });
        
        return fields.filter(field => typeof field === 'string');
    }

    displayResults(results, sectionType) {
        if (window.euGenAIHub) {
            switch(sectionType) {
                case 'institutions':
                    if (window.euGenAIHub.renderInstitutionsGrid) {
                        window.euGenAIHub.renderInstitutionsGrid(results);
                    }
                    break;
                case 'projects':
                    if (window.euGenAIHub.renderProjectsGrid) {
                        window.euGenAIHub.renderProjectsGrid(results);
                    }
                    break;
                case 'resources':
                    if (window.euGenAIHub.renderResourcesGrid) {
                        window.euGenAIHub.renderResourcesGrid(results);
                    }
                    break;
                case 'models':
                    if (window.euGenAIHub.updateModelsTable) {
                        window.euGenAIHub.updateModelsTable(results);
                    }
                    break;
            }
        }
    }

    displayPageResults(results, pageType, pageInstance) {
        try {
            switch(pageType) {
                case 'institutions':
                    if (pageInstance.renderInstitutions) {
                        pageInstance.renderInstitutions(results);
                    }
                    break;
                case 'projects':
                    if (pageInstance.renderProjectsGrid) {
                        pageInstance.renderProjectsGrid(results);
                    }
                    break;
                case 'resources':
                    if (pageInstance.renderResources) {
                        pageInstance.renderResources(results);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error displaying ${pageType} results:`, error);
        }
    }

    getSectionTypeFromInput(input) {
        const id = input.id;
        if (id.includes('institutions')) return 'institutions';
        if (id.includes('projects')) return 'projects';
        if (id.includes('resources')) return 'resources';
        if (id.includes('models')) return 'models';
        return 'institutions';
    }

    getFilterTypeFromInput(input) {
        const id = input.id;
        if (id.includes('country')) return 'country';
        if (id.includes('type')) return 'type';
        if (id.includes('status')) return 'status';
        if (id.includes('area')) return 'area';
        if (id.includes('year')) return 'year';
        if (id.includes('access')) return 'access';
        return 'type';
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim()
            .substring(0, 100);
    }

    destroy() {
        this.isDestroyed = true;
        clearTimeout(this.debounceTimer);
        this.searchCache.clear();
        this.activeFilters = {};
    }
}

// Initialize search manager
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.searchManager) {
            window.searchManager = new SearchManager();
        }
        window.searchManager.init();
    }, 500);
});

// Re-initialize when sections are loaded
document.addEventListener('sectionLoaded', () => {
    if (window.searchManager) {
        window.searchManager.init();
    }
});

// Re-initialize when page instances are created
window.addEventListener('pageInstanceCreated', () => {
    if (window.searchManager) {
        window.searchManager.init();
    }
});
