// Search and filtering functionality for all sections
class SearchManager {
    constructor() {
        this.data = null;
        this.searchInputs = {};
        this.filters = {};
        this.isInitialized = false;
    }

    init(data) {
        this.data = data;
        if (!this.isInitialized) {
            this.setupSearchInputs();
            this.setupFilters();
            this.isInitialized = true;
        }
    }

    setupSearchInputs() {
        // Setup search inputs for each section
        const searchInputs = [
            'institutions-search',
            'projects-search',
            'resources-search',
            'news-search'
        ];

        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                this.searchInputs[inputId] = input;
                
                // Add debounced search functionality
                let searchTimeout;
                input.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.performSearch(inputId, e.target.value);
                    }, 300);
                });

                // Add search icon and clear button
                this.enhanceSearchInput(input);
            }
        });
    }

    setupFilters() {
        // Setup filter dropdowns for each section
        const filterConfigs = [
            { id: 'institutions-filter-country', section: 'institutions', property: 'country' },
            { id: 'institutions-filter-type', section: 'institutions', property: 'type' },
            { id: 'projects-filter-status', section: 'projects', property: 'status' },
            { id: 'projects-filter-area', section: 'projects', property: 'research_areas' },
            { id: 'resources-filter-type', section: 'resources', property: 'type' },
            { id: 'resources-filter-year', section: 'resources', property: 'year' },
            { id: 'news-filter-category', section: 'news', property: 'category' }
        ];

        filterConfigs.forEach(config => {
            const filter = document.getElementById(config.id);
            if (filter) {
                this.filters[config.id] = {
                    element: filter,
                    section: config.section,
                    property: config.property
                };

                filter.addEventListener('change', (e) => {
                    this.applyFilters(config.section);
                });
            }
        });
    }

    enhanceSearchInput(input) {
        const wrapper = document.createElement('div');
        wrapper.className = 'search-input-wrapper';
        wrapper.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
        `;

        // Clone the input to preserve all attributes
        const newInput = input.cloneNode(true);
        newInput.style.paddingLeft = '2.5rem';
        newInput.style.paddingRight = '2.5rem';

        // Create search icon
        const searchIcon = document.createElement('div');
        searchIcon.innerHTML = '🔍';
        searchIcon.style.cssText = `
            position: absolute;
            left: 0.75rem;
            z-index: 2;
            color: var(--text-color);
            opacity: 0.5;
            pointer-events: none;
        `;

        // Create clear button
        const clearButton = document.createElement('button');
        clearButton.innerHTML = '✕';
        clearButton.className = 'search-clear';
        clearButton.style.cssText = `
            position: absolute;
            right: 0.75rem;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-color);
            opacity: 0.5;
            font-size: 1rem;
            z-index: 2;
            display: none;
        `;

        clearButton.addEventListener('click', () => {
            newInput.value = '';
            newInput.dispatchEvent(new Event('input'));
            this.updateClearButton(newInput, clearButton);
        });

        // Show/hide clear button based on input content
        newInput.addEventListener('input', () => {
            this.updateClearButton(newInput, clearButton);
        });

        // Replace original input with enhanced version
        input.parentNode.replaceChild(wrapper, input);
        wrapper.appendChild(searchIcon);
        wrapper.appendChild(newInput);
        wrapper.appendChild(clearButton);

        // Update reference
        this.searchInputs[input.id] = newInput;
    }

    updateClearButton(input, clearButton) {
        if (input.value.trim()) {
            clearButton.style.display = 'block';
        } else {
            clearButton.style.display = 'none';
        }
    }

    performSearch(inputId, query) {
        const section = this.getSectionFromInputId(inputId);
        if (!section) return;

        this.applyFilters(section, query);
    }

    getSectionFromInputId(inputId) {
        const mappings = {
            'institutions-search': 'institutions',
            'projects-search': 'projects',
            'resources-search': 'resources',
            'news-search': 'news'
        };
        return mappings[inputId];
    }

    applyFilters(section, searchQuery = null) {
        if (!this.data || !this.data[section]) return;

        // Get current search query if not provided
        if (searchQuery === null) {
            const searchInput = this.searchInputs[`${section}-search`];
            searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        }

        // Get current filter values
        const activeFilters = this.getActiveFilters(section);

        // Filter the data
        let filteredData = this.data[section].filter(item => {
            // Search filter
            if (searchQuery && !this.matchesSearch(item, searchQuery, section)) {
                return false;
            }

            // Property filters
            for (const [filterId, filterValue] of Object.entries(activeFilters)) {
                if (filterValue === 'all') continue;

                const filterConfig = this.filters[filterId];
                if (!filterConfig) continue;

                const property = filterConfig.property;
                const itemValue = item[property];

                if (Array.isArray(itemValue)) {
                    if (!itemValue.includes(filterValue)) return false;
                } else {
                    if (itemValue !== filterValue) return false;
                }
            }

            return true;
        });

        // Render filtered results
        this.renderFilteredResults(section, filteredData);

        // Update result count
        this.updateResultCount(section, filteredData.length, this.data[section].length);
    }

    getActiveFilters(section) {
        const activeFilters = {};
        
        Object.entries(this.filters).forEach(([filterId, config]) => {
            if (config.section === section) {
                activeFilters[filterId] = config.element.value;
            }
        });

        return activeFilters;
    }

    matchesSearch(item, query, section) {
        if (!query) return true;

        const searchFields = this.getSearchFields(section);
        
        return searchFields.some(field => {
            const value = this.getNestedProperty(item, field);
            
            if (Array.isArray(value)) {
                return value.some(v => 
                    String(v).toLowerCase().includes(query)
                );
            } else {
                return String(value || '').toLowerCase().includes(query);
            }
        });
    }

    getSearchFields(section) {
        const searchFieldMappings = {
            institutions: ['name', 'country', 'type', 'focus', 'description', 'research_areas'],
            projects: ['title', 'description', 'status', 'research_areas', 'partners'],
            resources: ['title', 'description', 'type', 'authors', 'keywords'],
            news: ['title', 'summary', 'category', 'tags']
        };

        return searchFieldMappings[section] || [];
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, prop) => {
            return current && current[prop] !== undefined ? current[prop] : null;
        }, obj);
    }

    renderFilteredResults(section, filteredData) {
        const container = document.getElementById(`${section}-grid`);
        if (!container) return;

        if (filteredData.length === 0) {
            container.innerHTML = this.getEmptySearchState(section);
            return;
        }

        // Use the main app's render methods
        if (window.app) {
            // Temporarily replace the data for rendering
            const originalData = window.app.data[section];
            window.app.data[section] = filteredData;
            
            // Call the appropriate render method
            switch (section) {
                case 'institutions':
                    window.app.renderInstitutions();
                    break;
                case 'projects':
                    window.app.renderProjects();
                    break;
                case 'resources':
                    window.app.renderResources();
                    break;
                case 'news':
                    window.app.renderNews();
                    break;
            }
            
            // Restore original data
            window.app.data[section] = originalData;
        }
    }

    updateResultCount(section, filteredCount, totalCount) {
        // Find or create result count element
        const searchContainer = document.getElementById(`${section}-search`)?.parentNode;
        if (!searchContainer) return;

        let countElement = searchContainer.querySelector('.result-count');
        if (!countElement) {
            countElement = document.createElement('div');
            countElement.className = 'result-count';
            countElement.style.cssText = `
                font-size: 0.9rem;
                color: var(--text-color);
                opacity: 0.7;
                margin-top: 0.5rem;
            `;
            searchContainer.appendChild(countElement);
        }

        if (filteredCount === totalCount) {
            countElement.textContent = `Showing all ${totalCount} results`;
        } else {
            countElement.textContent = `Showing ${filteredCount} of ${totalCount} results`;
        }
    }

    getEmptySearchState(section) {
        const searchInput = this.searchInputs[`${section}-search`];
        const hasSearchQuery = searchInput && searchInput.value.trim();
        const activeFilters = this.getActiveFilters(section);
        const hasActiveFilters = Object.values(activeFilters).some(value => value !== 'all');

        let message = 'No results found.';
        if (hasSearchQuery || hasActiveFilters) {
            message = 'No results match your current search and filters.';
        }

        return `
            <div class="empty-state">
                <h3>No Results Found</h3>
                <p>${message}</p>
                ${(hasSearchQuery || hasActiveFilters) ? `
                    <button onclick="window.SearchManager.clearAllFilters('${section}')" 
                            class="btn btn-primary" style="margin-top: 1rem;">
                        Clear Filters
                    </button>
                ` : ''}
            </div>
        `;
    }

    clearAllFilters(section) {
        // Clear search input
        const searchInput = this.searchInputs[`${section}-search`];
        if (searchInput) {
            searchInput.value = '';
        }

        // Reset all filters for this section
        Object.entries(this.filters).forEach(([filterId, config]) => {
            if (config.section === section) {
                config.element.value = 'all';
            }
        });

        // Reapply filters (which will now show all results)
        this.applyFilters(section);
    }

    // Advanced search functionality
    setupAdvancedSearch() {
        // This could be extended to include:
        // - Boolean operators (AND, OR, NOT)
        // - Field-specific search
        // - Date range filters
        // - Fuzzy search
        // - Search suggestions/autocomplete
    }

    // Export search results
    exportSearchResults(section, format = 'json') {
        const activeFilters = this.getActiveFilters(section);
        const searchInput = this.searchInputs[`${section}-search`];
        const query = searchInput ? searchInput.value.trim() : '';

        // Filter data based on current search and filters
        let filteredData = this.data[section].filter(item => {
            if (query && !this.matchesSearch(item, query.toLowerCase(), section)) {
                return false;
            }

            for (const [filterId, filterValue] of Object.entries(activeFilters)) {
                if (filterValue === 'all') continue;

                const filterConfig = this.filters[filterId];
                if (!filterConfig) continue;

                const property = filterConfig.property;
                const itemValue = item[property];

                if (Array.isArray(itemValue)) {
                    if (!itemValue.includes(filterValue)) return false;
                } else {
                    if (itemValue !== filterValue) return false;
                }
            }

            return true;
        });

        // Create download
        const dataStr = JSON.stringify(filteredData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `eu-genai-${section}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.SearchManager = new SearchManager();
