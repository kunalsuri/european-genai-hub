/**
 * Page-Specific Search Managers for EU GenAI Hub
 * Each page type has different data structures and needs specialized search logic
 */
'use strict';

// Base Search Manager
class BaseSearchManager {
    constructor(pageType) {
        this.pageType = pageType;
        this.debounceTimer = null;
        this.isDestroyed = false;
        this.searchCache = new Map();
        this.maxCacheSize = 50;
        this.activeFilters = {};
        this.dataSource = null;
        this.renderCallback = null;
    }

    init(dataSource, renderCallback) {
        if (this.isDestroyed || !dataSource || !renderCallback) return;
        
        try {
            this.dataSource = dataSource;
            this.renderCallback = renderCallback;
            
            this.setupSearchInputs();
            this.setupFilters();
            
            window.logger.log(`${this.pageType} search initialized`);
        } catch (error) {
            window.logger.error(`Failed to initialize ${this.pageType} search:`, error);
            this.destroy();
        }
    }

    setupSearchInputs() {
        const searchInput = document.getElementById(`${this.pageType}-search`);
        if (!searchInput) return;

        // Remove existing listeners
        searchInput.removeEventListener('input', this.boundHandleSearchInput);
        searchInput.removeEventListener('paste', this.boundHandleSearchPaste);
        
        // Bind handlers
        this.boundHandleSearchInput = (e) => this.handleSearchInput(e);
        this.boundHandleSearchPaste = (e) => this.handleSearchPaste(e);
        
        // Add new listeners
        searchInput.addEventListener('input', this.boundHandleSearchInput);
        searchInput.addEventListener('paste', this.boundHandleSearchPaste);
    }

    setupFilters() {
        const filterSelects = document.querySelectorAll(`select[id*="${this.pageType}-filter"]`);
        
        // Bind handler
        this.boundHandleFilterChange = (e) => this.handleFilterChange(e);
        
        filterSelects.forEach(select => {
            if (!select) return;
            
            // Remove existing listeners
            select.removeEventListener('change', this.boundHandleFilterChange);
            
            // Add new listener
            select.addEventListener('change', this.boundHandleFilterChange);
        });
    }

    handleSearchInput(e) {
        const value = this.sanitizeInput(e.target.value);
        if (value !== e.target.value) {
            e.target.value = value;
        }
        this.performSearch();
    }

    handleSearchPaste(e) {
        setTimeout(() => {
            const sanitized = this.sanitizeInput(e.target.value);
            if (sanitized !== e.target.value) {
                e.target.value = sanitized;
            }
            this.performSearch();
        }, 0);
    }

    handleFilterChange(e) {
        const selectedValue = e.target.value;
        const validOptions = Array.from(e.target.options).map(opt => opt.value);
        
        if (!validOptions.includes(selectedValue)) {
            e.target.value = 'all';
            return;
        }
        
        // Store filter state
        const filterType = this.getFilterType(e.target.id);
        this.activeFilters[filterType] = selectedValue;
        
        window.logger.log(`${this.pageType} filter changed: ${filterType} = ${selectedValue}`);
        
        this.performSearch();
    }

    performSearch() {
        if (this.isDestroyed || !this.dataSource || !this.renderCallback) return;
        
        clearTimeout(this.debounceTimer);
        const searchId = Date.now(); // Create unique search ID for race condition protection
        
        this.debounceTimer = setTimeout(() => {
            try {
                // Check if search was cancelled/destroyed
                if (this.isDestroyed) return;
                
                const searchInput = document.getElementById(`${this.pageType}-search`);
                const query = searchInput ? this.sanitizeInput(searchInput.value.trim()) : '';
                
                // Check cache first
                const cacheKey = this.getCacheKey(query, this.activeFilters);
                if (this.searchCache.has(cacheKey)) {
                    const cachedResults = this.searchCache.get(cacheKey);
                    if (Array.isArray(cachedResults)) {
                        this.renderCallback(cachedResults);
                    }
                    return;
                }
                
                // Perform search and filtering with error handling
                let results = this.filterData(this.dataSource, query);
                if (!Array.isArray(results)) {
                    window.logger.error('filterData returned non-array result');
                    results = [];
                }
                
                results = this.applyFilters(results);
                if (!Array.isArray(results)) {
                    window.logger.error('applyFilters returned non-array result');
                    results = [];
                }
                
                // Limit results to prevent performance issues
                const maxResults = 1000;
                if (results.length > maxResults) {
                    results = results.slice(0, maxResults);
                    window.logger.warn(`Search results truncated to ${maxResults} items`);
                }
                
                // Cache results
                this.cacheResults(cacheKey, results);
                
                // Final check before rendering
                if (!this.isDestroyed && typeof this.renderCallback === 'function') {
                    this.renderCallback(results);
                }
                
            } catch (error) {
                window.logger.error(`Search error for ${this.pageType}:`, error);
                // Fallback to showing all data
                if (!this.isDestroyed && typeof this.renderCallback === 'function') {
                    this.renderCallback(this.dataSource || []);
                }
            }
        }, 300);
    }

    // Override these methods in subclasses
    filterData(data, query) {
        // Base implementation - subclasses should override this
        return data;
    }

    applyFilters(data) {
        return data;
    }

    getFilterType(elementId) {
        const parts = elementId.split('-');
        return parts[parts.length - 1];
    }

    getCacheKey(query, filters) {
        return `${this.pageType}-${query}-${JSON.stringify(filters)}`;
    }

    cacheResults(key, results) {
        if (this.searchCache.size >= this.maxCacheSize) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(key, results);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '') // Fixed: removed double backslash
            .replace(/data:/gi, '') // Block data: URLs
            .replace(/vbscript:/gi, '') // Block vbscript: URLs
            .replace(/['"]/g, '') // Remove quotes to prevent attribute injection
            .slice(0, 100)
            .trim();
    }

    destroy() {
        this.isDestroyed = true;
        clearTimeout(this.debounceTimer);
        this.searchCache.clear();
        this.activeFilters = {};
        this.dataSource = null;
        this.renderCallback = null;
    }
}

// Institutions Search Manager
class InstitutionsSearchManager extends BaseSearchManager {
    constructor() {
        super('institutions');
    }

    filterData(data, query) {
        if (!query || !Array.isArray(data)) return data;
        
        try {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            
            return data.filter(item => {
                if (!item || typeof item !== 'object') return false;
                
                const searchFields = [
                    this.sanitizeSearchField(item.name || ''),
                    this.sanitizeSearchField(item.description || ''),
                    this.sanitizeSearchField(item.country || ''),
                    this.sanitizeSearchField(item.city || ''),
                    this.sanitizeSearchField(item.type || ''),
                    this.sanitizeSearchField(item.focus || ''),
                    ...(Array.isArray(item.research_areas) ? item.research_areas.map(area => this.sanitizeSearchField(area)) : [])
                ];
                
                const searchText = searchFields.join(' ').toLowerCase();
                return searchTerms.every(term => searchText.includes(term));
            });
        } catch (error) {
            window.logger.error('Error in filterData:', error);
            return data;
        }
    }
    
    sanitizeSearchField(field) {
        if (typeof field !== 'string') return '';
        return field.replace(/[<>]/g, '').trim();
    }

    applyFilters(data) {
        if (!this.activeFilters || Object.keys(this.activeFilters).length === 0) return data;
        
        try {
            return data.filter(item => {
                if (!item || typeof item !== 'object') return false;
                
                return Object.entries(this.activeFilters).every(([filterType, filterValue]) => {
                    if (filterValue === 'all') return true;
                    
                    // Sanitize filter values
                    const sanitizedFilterValue = this.sanitizeSearchField(filterValue);
                    
                    switch (filterType) {
                        case 'country':
                            return (item.country || '').toLowerCase() === sanitizedFilterValue.toLowerCase();
                        case 'type':
                            const itemType = (item.type || '').toLowerCase();
                            const filterValueLower = sanitizedFilterValue.toLowerCase();
                            return itemType === filterValueLower || 
                                   (filterValueLower === 'university' && itemType.includes('university')) ||
                                   (filterValueLower === 'research' && (itemType.includes('research') || itemType.includes('center'))) ||
                                   (filterValueLower === 'industry' && (itemType.includes('industry') || itemType.includes('company')));
                        default:
                            return true;
                    }
                });
            });
        } catch (error) {
            window.logger.error('Error in applyFilters:', error);
            return data;
        }
    }
}

// Projects Search Manager
class ProjectsSearchManager extends BaseSearchManager {
    constructor() {
        super('projects');
    }

    filterData(data, query) {
        if (!query || !Array.isArray(data)) return data;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return data.filter(item => {
            const searchFields = [
                item.title || '',
                item.description || '',
                item.institution || '',
                item.country || '',
                item.status || '',
                item.category || '',
                item.funding || '',
                ...(item.participants || []),
                ...(item.technologies || [])
            ];
            
            const searchText = searchFields.join(' ').toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }

    applyFilters(data) {
        if (!this.activeFilters || Object.keys(this.activeFilters).length === 0) return data;
        
        return data.filter(item => {
            return Object.entries(this.activeFilters).every(([filterType, filterValue]) => {
                if (filterValue === 'all') return true;
                
                switch (filterType) {
                    case 'status':
                        return (item.status || '').toLowerCase() === filterValue.toLowerCase();
                    case 'country':
                        return (item.country || '').toLowerCase() === filterValue.toLowerCase();
                    default:
                        return true;
                }
            });
        });
    }
}

// Resources Search Manager
class ResourcesSearchManager extends BaseSearchManager {
    constructor() {
        super('resources');
    }

    filterData(data, query) {
        if (!query || !Array.isArray(data)) return data;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return data.filter(item => {
            const searchFields = [
                item.title || '',
                item.description || '',
                item.institution || '',
                item.type || '',
                item.year ? item.year.toString() : '',
                ...(item.authors || []),
                ...(item.keywords || [])
            ];
            
            const searchText = searchFields.join(' ').toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }

    applyFilters(data) {
        if (!this.activeFilters || Object.keys(this.activeFilters).length === 0) return data;
        
        return data.filter(item => {
            return Object.entries(this.activeFilters).every(([filterType, filterValue]) => {
                if (filterValue === 'all') return true;
                
                switch (filterType) {
                    case 'type':
                        return (item.type || '').toLowerCase() === filterValue.toLowerCase();
                    case 'year':
                        return (item.year || '').toString() === filterValue;
                    default:
                        return true;
                }
            });
        });
    }
}

// Models Search Manager
class ModelsSearchManager extends BaseSearchManager {
    constructor() {
        super('models');
    }

    filterData(data, query) {
        if (!query || !Array.isArray(data)) return data;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return data.filter(item => {
            const searchFields = [
                item.project_name || '',
                item.description || '',
                item.model_type || '',
                item.status || '',
                item.funding || '',
                ...(item.key_partners || []),
                ...(item.models_developed || []),
                ...(item.languages || [])
            ];
            
            const searchText = searchFields.join(' ').toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }

    applyFilters(data) {
        if (!this.activeFilters || Object.keys(this.activeFilters).length === 0) return data;
        
        return data.filter(item => {
            return Object.entries(this.activeFilters).every(([filterType, filterValue]) => {
                if (filterValue === 'all') return true;
                
                switch (filterType) {
                    case 'type':
                        return (item.model_type || '').toLowerCase() === filterValue.toLowerCase();
                    case 'status':
                        return (item.status || '').toLowerCase() === filterValue.toLowerCase();
                    default:
                        return true;
                }
            });
        });
    }
}

// Global instances
window.institutionsSearchManager = new InstitutionsSearchManager();
window.projectsSearchManager = new ProjectsSearchManager();
window.resourcesSearchManager = new ResourcesSearchManager();
window.modelsSearchManager = new ModelsSearchManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InstitutionsSearchManager,
        ProjectsSearchManager,
        ResourcesSearchManager,
        ModelsSearchManager
    };
}