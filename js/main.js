// Main application JavaScript with security and performance improvements
'use strict';

class EUGenAIHub {
    constructor() {
        this.currentSection = 'home';
        this.data = {
            institutions: [],
            projects: [],
            resources: [],
            models: []
        };
        this.eventListeners = new Map(); // Track event listeners for cleanup
        this.loadedSections = new Set(); // Track which sections have been loaded
        this.abortController = new AbortController(); // For cancelling requests
        this.isDestroyed = false;
        this.init();
    }

    async init() {
        if (this.isDestroyed) return;

        try {
            // Validate security headers
            this.validateSecurityHeaders();
            
            // Load minimal data first - only what's needed for the home page
            await this.loadHomeData();

            // Initialize components
            this.initNavigation();
            this.initStats();

            // Show home section
            this.showSection('home');

            window.logger.log('European GenAI Hub initialized successfully');

            // Load other data in background
            this.loadRemainingDataInBackground();
        } catch (error) {
            window.logger.error('Error initializing application:', error);
            this.showError('Failed to load application data. Please refresh the page.');
            // Graceful degradation
            this.showEmergencyMode();
        }
    }
    
    validateSecurityHeaders() {
        try {
            // Check for CSP header
            const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!metaCSP) {
                window.logger.warn('Content Security Policy not found');
            }
            
            // Check for secure context
            if (!window.isSecureContext && location.protocol !== 'http:') {
                window.logger.warn('Application not running in secure context');
            }
            
            // Validate against potential XSS in URL parameters
            if (window.location.search.includes('<') || window.location.search.includes('>')) {
                window.logger.error('Potential XSS in URL parameters');
                window.location.search = '';
            }
        } catch (error) {
            window.logger.error('Security validation error:', error);
        }
    }
    
    showEmergencyMode() {
        try {
            const homeSection = document.getElementById('home');
            if (homeSection) {
                homeSection.innerHTML = `
                    <div class="emergency-mode">
                        <h2>Service Temporarily Unavailable</h2>
                        <p>We're experiencing technical difficulties. Please try refreshing the page.</p>
                        <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                    </div>
                `;
            }
        } catch (error) {
            window.logger.error('Emergency mode failed:', error);
        }
    }

    async loadHomeData() {
        try {
            // Only load institutions for initial stats - other data loaded on demand
            const institutions = await this.fetchWithTimeout('data/institutions.json', 5000)
                .then(r => r.json())
                .catch(() => []);

            this.data.institutions = this.sanitizeData(institutions);
        } catch (error) {
            window.logger.error('Error loading home data:', error);
            this.data.institutions = [];
        }
    }

    async loadRemainingDataInBackground() {
        try {
            // Load non-critical data in background
            const [projects, resources, models] = await Promise.allSettled([
                this.fetchWithTimeout('data/projects.json', 5000).then(r => r.json()).catch(() => []),
                this.fetchWithTimeout('data/resources.json', 5000).then(r => r.json()).catch(() => []),
                this.fetchWithTimeout('data/models.json', 5000).then(r => r.json()).catch(() => [])
            ]);

            this.data.projects = this.sanitizeData(projects.status === 'fulfilled' ? projects.value : []);
            this.data.resources = this.sanitizeData(resources.status === 'fulfilled' ? resources.value : []);
            this.data.models = this.sanitizeData(models.status === 'fulfilled' ? models.value : []);

            // Update stats after all data is loaded
            this.initStats();
        } catch (error) {
            window.logger.error('Error loading background data:', error);
        }
    }

    fetchWithTimeout(url, timeout = 5000) {
        // Validate URL to prevent SSRF attacks
        if (!this.isValidUrl(url)) {
            return Promise.reject(new Error('Invalid URL'));
        }

        return Promise.race([
            fetch(url, { 
                signal: this.abortController.signal,
                mode: 'same-origin',
                credentials: 'same-origin'
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    isValidUrl(string) {
        try {
            const url = new URL(string, window.location.origin);
            // Only allow same-origin requests for security
            return url.origin === window.location.origin && 
                   url.pathname.startsWith('/data/') &&
                   url.pathname.endsWith('.json');
        } catch (_) {
            return false;
        }
    }

    sanitizeData(data) {
        if (!Array.isArray(data)) return [];

        return data.map(item => {
            const sanitized = {};
            for (const [key, value] of Object.entries(item)) {
                if (typeof value === 'string') {
                    // Sanitize strings to prevent XSS
                    sanitized[key] = this.sanitizeString(value);
                } else if (Array.isArray(value)) {
                    // Sanitize arrays of strings
                    sanitized[key] = value.map(v => 
                        typeof v === 'string' ? this.sanitizeString(v) : v
                    );
                } else {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        });
    }

    sanitizeString(str) {
        if (typeof str !== 'string') return str;

        // Remove potential XSS vectors
        return str
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    }

    initNavigation() {
        // Navigation links - include dropdown links
        const navLinks = document.querySelectorAll('.nav-link, .nav-dropdown-link, .mobile-nav-link, .footer-link');
        navLinks.forEach(link => {
            const listener = (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            };

            this.addEventListener(link, 'click', listener);
        });

        // Hero buttons
        const heroButtons = document.querySelectorAll('[data-section]');
        heroButtons.forEach(button => {
            const listener = (e) => {
                e.preventDefault();
                const section = button.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            };

            this.addEventListener(button, 'click', listener);
        });
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);

        // Store for cleanup
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler });
    }

    showSection(sectionName) {
        if (this.isDestroyed) return;

        // Validate section name to prevent XSS
        const allowedSections = ['home', 'institutions', 'projects', 'models', 'resources', 'featured-initiatives', 'research-areas'];
        if (!allowedSections.includes(sectionName)) {
            window.logger.warn('Invalid section name:', sectionName);
            return;
        }

        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.classList.remove('hidden');
            this.currentSection = sectionName;

            // Update navigation active state
            const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === sectionName) {
                    link.classList.add('active');
                }
            });

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }

            // Load section content only when needed
            this.loadSectionContent(sectionName);
        }
    }

    async loadSectionContent(sectionName) {
        if (this.isDestroyed || this.loadedSections.has(sectionName)) return;

        try {
            switch (sectionName) {
                case 'institutions':
                    this.renderInstitutions();
                    break;
                case 'projects':
                    this.renderProjects();
                    break;
                case 'resources':
                    this.renderResources();
                    break;
                case 'models':
                    this.renderModels();
                    break;
                case 'featured-initiatives':
                    this.renderFeaturedInitiatives();
                    break;
                case 'research-areas':
                    this.renderResearchAreas();
                    break;
            }

            this.loadedSections.add(sectionName);
        } catch (error) {
            window.logger.error(`Error loading ${sectionName} content:`, error);
            this.showSectionError(sectionName);
        }
    }

    showSectionError(sectionName) {
        const container = document.getElementById(sectionName);
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Error Loading Content</h3>
                    <p>Failed to load ${sectionName} data. Please try refreshing the page.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                </div>
            `;
        }
    }

    initStats() {
        if (!this.data || this.isDestroyed) return;

        // Calculate statistics safely
        const stats = {
            institutions: Array.isArray(this.data.institutions) ? this.data.institutions.length : 0,
            projects: Array.isArray(this.data.projects) ? this.data.projects.length : 0,
            resources: Array.isArray(this.data.resources) ? this.data.resources.length : 0,
            countries: Array.isArray(this.data.institutions) ? 
                new Set(this.data.institutions.map(inst => inst.country).filter(Boolean)).size : 0
        };

        // Models count is included in the general statistics calculation
        
        // Animate counters with bounds checking
        this.animateCounter('institutions-count', Math.min(stats.institutions, 9999));
        this.animateCounter('projects-count', Math.min(stats.projects, 9999));
        this.animateCounter('resources-count', Math.min(stats.resources, 9999));
        this.animateCounter('countries-count', Math.min(stats.countries, 9999));
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element || this.isDestroyed) return;

        // Validate target value
        const target = Math.max(0, Math.min(targetValue, 99999));
        let currentValue = 0;
        const increment = target / 50; // Reduce iterations for performance

        const timer = setInterval(() => {
            if (this.isDestroyed) {
                clearInterval(timer);
                return;
            }

            currentValue += increment;
            if (currentValue >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 40); // Slower animation for better performance
    }

    renderInstitutions() {
        const container = document.getElementById('institutions');
        if (!container || this.isDestroyed) return;

        if (!Array.isArray(this.data.institutions) || this.data.institutions.length === 0) {
            container.innerHTML = this.getEmptyState('institutions');
            return;
        }

        // Create institutions section HTML
        container.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Research Institutions</h2>
                    <p class="section-description">Leading European institutions advancing Generative AI research and innovation</p>
                </div>

                <div class="filter-wrapper">
                    <div class="filter-container">
                        <div class="filter-group">
                            <i data-lucide="search" class="filter-icon"></i>
                            <input type="text" id="institutions-search" placeholder="Search institutions..." 
                                   class="filter-input" maxlength="100" autocomplete="off">
                        </div>
                        <div class="filter-group">
                            <i data-lucide="globe" class="filter-icon"></i>
                            <select id="institutions-filter-country" class="filter-select" aria-label="Filter by country">
                                <option value="all">All Countries</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <i data-lucide="building-2" class="filter-icon"></i>
                            <select id="institutions-filter-type" class="filter-select" aria-label="Filter by type">
                                <option value="all">All Types</option>
                                <option value="university">Universities</option>
                                <option value="research">Research Centers</option>
                                <option value="industry">Industry Labs</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="institutions-grid" class="content-grid"></div>
            </div>
        `;

        this.renderInstitutionsGrid();
        this.populateFilterOptions('institutions-filter-country', 
            [...new Set(this.data.institutions.map(inst => inst.country).filter(Boolean))]);

        // Initialize search with page-specific search manager
        setTimeout(() => {
            if (window.institutionsSearchManager && this.data.institutions) {
                window.institutionsSearchManager.init(this.data.institutions, (filteredData) => {
                    this.renderInstitutionsGrid(filteredData);
                });
            }
        }, 100);

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderInstitutionsGrid(customData = null) {
        const container = document.getElementById('institutions-grid');
        if (!container || this.isDestroyed) return;

        const institutionsToRender = customData || this.data.institutions || [];

        container.innerHTML = institutionsToRender.map(institution => `
            <div class="content-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i data-lucide="${this.getInstitutionIcon(institution.type)}"></i>
                    </div>
                    <span class="card-badge card-badge-${this.getTypeColor(institution.type)}">
                        ${this.escapeHtml(institution.type || 'Unknown')}
                    </span>
                </div>

                <h3 class="card-title">${this.escapeHtml(institution.name || 'Unknown Institution')}</h3>

                <div class="card-meta">
                    <i data-lucide="map-pin"></i>
                    <span>${this.escapeHtml(institution.city || '')}, ${this.escapeHtml(institution.country || '')}</span>
                </div>

                <p class="card-description">
                    ${this.escapeHtml(this.truncateText(institution.description || '', 150))}
                </p>

                ${institution.research_areas && Array.isArray(institution.research_areas) ? `
                    <div class="card-tags">
                        ${institution.research_areas.slice(0, 3).map(area => 
                            `<span class="tag">${this.escapeHtml(area)}</span>`
                        ).join('')}
                        ${institution.research_areas.length > 3 ? 
                            `<span class="tag">+${institution.research_areas.length - 3} more</span>` : ''
                        }
                    </div>
                ` : ''}

                ${institution.website ? `
                    <a href="${this.sanitizeUrl(institution.website)}" target="_blank" rel="noopener noreferrer"
                       class="card-link">
                        <span>Visit Website</span>
                        <i data-lucide="external-link"></i>
                    </a>
                ` : ''}
            </div>
        `).join('');

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderProjects() {
        const container = document.getElementById('projects');
        if (!container || this.isDestroyed) return;

        if (!Array.isArray(this.data.projects) || this.data.projects.length === 0) {
            container.innerHTML = this.getEmptyState('projects');
            return;
        }

        container.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Research Projects</h2>
                    <p class="section-description">Current and ongoing GenAI research initiatives across Europe</p>
                </div>

                <div class="filter-wrapper">
                    <div class="filter-container">
                        <div class="filter-group">
                            <i data-lucide="search" class="filter-icon"></i>
                            <input type="text" id="projects-search" placeholder="Search projects..." 
                                   class="filter-input" maxlength="100" autocomplete="off">
                        </div>
                        <div class="filter-group">
                            <i data-lucide="activity" class="filter-icon"></i>
                            <select id="projects-filter-status" class="filter-select" aria-label="Filter by status">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="planned">Planned</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="projects-grid" class="content-grid"></div>
            </div>
        `;

        this.renderProjectsGrid();

        // Initialize search with page-specific search manager
        setTimeout(() => {
            if (window.projectsSearchManager && this.data.projects) {
                window.projectsSearchManager.init(this.data.projects, (filteredData) => {
                    this.renderProjectsGrid(filteredData);
                });
            }
        }, 100);

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderProjectsGrid(customData = null) {
        const container = document.getElementById('projects-grid');
        if (!container || this.isDestroyed) return;

        const projectsToRender = customData || this.data.projects || [];

        container.innerHTML = projectsToRender.map(project => `
            <div class="content-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i data-lucide="rocket"></i>
                    </div>
                    <span class="card-badge card-badge-${this.getStatusColor(project.status)}">
                        ${this.escapeHtml(project.status || 'Unknown')}
                    </span>
                </div>

                <h3 class="card-title">${this.escapeHtml(project.title || 'Unknown Project')}</h3>

                <div class="card-meta-grid">
                    <div class="card-meta">
                        <i data-lucide="calendar"></i>
                        <span>${this.formatDateRange(project.start_date, project.end_date)}</span>
                    </div>
                    <div class="card-meta">
                        <i data-lucide="euro"></i>
                        <span class="font-semibold">${this.escapeHtml(project.funding || 'N/A')}</span>
                    </div>
                </div>

                <p class="card-description">
                    ${this.escapeHtml(this.truncateText(project.description || '', 150))}
                </p>

                ${project.technologies && Array.isArray(project.technologies) ? `
                    <div class="card-tags">
                        ${project.technologies.slice(0, 3).map(tech => 
                            `<span class="tag tag-primary">${this.escapeHtml(tech)}</span>`
                        ).join('')}
                        ${project.technologies.length > 3 ? 
                            `<span class="tag">+${project.technologies.length - 3} more</span>` : ''
                        }
                    </div>
                ` : ''}

                ${project.website ? `
                    <a href="${this.sanitizeUrl(project.website)}" target="_blank" rel="noopener noreferrer"
                       class="card-link">
                        <span>Visit Project</span>
                        <i data-lucide="external-link"></i>
                    </a>
                ` : ''}
            </div>
        `).join('');

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderResources() {
        const container = document.getElementById('resources');
        if (!container || this.isDestroyed) return;

        if (!Array.isArray(this.data.resources) || this.data.resources.length === 0) {
            container.innerHTML = this.getEmptyState('resources');
            return;
        }

        container.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Research Resources</h2>
                    <p class="section-description">Papers, datasets, tools, and other resources from European GenAI research</p>
                </div>

                <div class="filter-wrapper">
                    <div class="filter-container">
                        <div class="filter-group">
                            <i data-lucide="search" class="filter-icon"></i>
                            <input type="text" id="resources-search" placeholder="Search resources..." 
                                   class="filter-input" maxlength="100" autocomplete="off">
                        </div>
                        <div class="filter-group">
                            <i data-lucide="file-text" class="filter-icon"></i>
                            <select id="resources-filter-type" class="filter-select" aria-label="Filter by type">
                                <option value="all">All Types</option>
                                <option value="paper">Research Papers</option>
                                <option value="dataset">Datasets</option>
                                <option value="tool">Tools & Software</option>
                                <option value="report">Reports</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="resources-grid" class="content-grid"></div>
            </div>
        `;

        this.renderResourcesGrid();

        // Initialize search with page-specific search manager
        setTimeout(() => {
            if (window.resourcesSearchManager && this.data.resources) {
                window.resourcesSearchManager.init(this.data.resources, (filteredData) => {
                    this.renderResourcesGrid(filteredData);
                });
            }
        }, 100);

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderResourcesGrid(customData = null) {
        const container = document.getElementById('resources-grid');
        if (!container || this.isDestroyed) return;

        const resourcesToRender = customData || this.data.resources || [];

        container.innerHTML = resourcesToRender.map(resource => `
            <div class="content-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i data-lucide="${this.getResourceIcon(resource.type)}"></i>
                    </div>
                    <span class="card-badge card-badge-${this.getTypeColor(resource.type)}">
                        ${this.escapeHtml(resource.type || 'Unknown')}
                    </span>
                </div>

                <h3 class="card-title">${this.escapeHtml(resource.title || 'Unknown Resource')}</h3>

                <div class="card-meta-grid">
                    <div class="card-meta">
                        <i data-lucide="calendar"></i>
                        <span>${this.escapeHtml(resource.year || 'Unknown')}</span>
                    </div>
                    <div class="card-meta">
                        <i data-lucide="building"></i>
                        <span>${this.escapeHtml(this.truncateText(resource.institution || '', 30))}</span>
                    </div>
                </div>

                <p class="card-description">
                    ${this.escapeHtml(this.truncateText(resource.description || '', 150))}
                </p>

                ${resource.keywords && Array.isArray(resource.keywords) ? `
                    <div class="card-tags">
                        ${resource.keywords.slice(0, 3).map(keyword => 
                            `<span class="tag tag-primary">${this.escapeHtml(keyword)}</span>`
                        ).join('')}
                        ${resource.keywords.length > 3 ? 
                            `<span class="tag">+${resource.keywords.length - 3} more</span>` : ''
                        }
                    </div>
                ` : ''}

                ${resource.url ? `
                    <a href="${this.sanitizeUrl(resource.url)}" target="_blank" rel="noopener noreferrer"
                       class="card-link">
                        <span>Access Resource</span>
                        <i data-lucide="external-link"></i>
                    </a>
                ` : ''}
            </div>
        `).join('');

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderModels() {
        const container = document.getElementById('models');
        if (!container || this.isDestroyed) return;

        if (!Array.isArray(this.data.models) || this.data.models.length === 0) {
            container.innerHTML = this.getEmptyState('models');
            return;
        }

        container.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">European LLM/VLM Models</h2>
                    <p class="section-description">Large Language Models and Vision-Language Models from European research</p>
                </div>

                <div class="filter-wrapper">
                    <div class="filter-container">
                        <div class="filter-group">
                            <i data-lucide="search" class="filter-icon"></i>
                            <input type="text" id="models-search" placeholder="Search models..." 
                                   class="filter-input" maxlength="100" autocomplete="off">
                        </div>
                        <div class="filter-group">
                            <i data-lucide="brain" class="filter-icon"></i>
                            <select id="models-filter-type" class="filter-select" aria-label="Filter by type">
                                <option value="all">All Types</option>
                                <option value="LLM">Large Language Models</option>
                                <option value="VLM">Vision-Language Models</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="models-grid" class="content-grid"></div>
            </div>
        `;

        this.renderModelsGrid();

        // Initialize search with page-specific search manager
        setTimeout(() => {
            if (window.modelsSearchManager && this.data.models) {
                window.modelsSearchManager.init(this.data.models, (filteredData) => {
                    this.renderModelsGrid(filteredData);
                });
            }
        }, 100);

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderModelsGrid(customData = null) {
        const container = document.getElementById('models-grid');
        if (!container || this.isDestroyed) return;

        const modelsToRender = customData || this.data.models || [];

        container.innerHTML = modelsToRender.map(model => `
            <div class="content-card">
                <div class="card-header">
                    <div class="card-icon">
                        <i data-lucide="brain"></i>
                    </div>
                    <span class="card-badge card-badge-${this.getTypeColor(model.model_type)}">
                        ${this.escapeHtml(model.model_type || 'Unknown')}
                    </span>
                </div>

                <h3 class="card-title">${this.escapeHtml(model.project_name || 'Unknown Model')}</h3>

                <div class="card-meta-grid">
                    <div class="card-meta">
                        <i data-lucide="calendar"></i>
                        <span>${this.escapeHtml(model.year || 'Unknown')}</span>
                    </div>
                    <div class="card-meta">
                        <i data-lucide="users"></i>
                        <span>${Array.isArray(model.key_partners) ? model.key_partners.length : 0} partners</span>
                    </div>
                </div>

                <p class="card-description">
                    ${this.escapeHtml(this.truncateText(model.description || '', 150))}
                </p>

                ${model.languages && Array.isArray(model.languages) ? `
                    <div class="card-tags">
                        ${model.languages.slice(0, 3).map(lang => 
                            `<span class="tag tag-primary">${this.escapeHtml(lang)}</span>`
                        ).join('')}
                        ${model.languages.length > 3 ? 
                            `<span class="tag">+${model.languages.length - 3} more</span>` : ''
                        }
                    </div>
                ` : ''}

                ${model.url ? `
                    <a href="${this.sanitizeUrl(model.url)}" target="_blank" rel="noopener noreferrer"
                       class="card-link">
                        <span>View Model</span>
                        <i data-lucide="external-link"></i>
                    </a>
                ` : ''}
            </div>
        `).join('');

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    populateFilterOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select || !Array.isArray(options)) return;

        // Keep the "All" option and add new options
        const currentOptions = Array.from(select.options).slice(1);
        currentOptions.forEach(option => option.remove());

        options.filter(Boolean).sort().forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = this.escapeHtml(option);
            optionElement.textContent = this.escapeHtml(option);
            select.appendChild(optionElement);
        });
    }

    getEmptyState(type) {
        const messages = {
            institutions: {
                title: 'No Institutions Found',
                message: 'No research institutions are available at the moment.'
            },
            projects: {
                title: 'No Projects Found',
                message: 'No research projects are available at the moment.'
            },
            resources: {
                title: 'No Resources Found',
                message: 'No research resources are available at the moment.'
            },
            models: {
                title: 'No Models Found',
                message: 'No model information is available at the moment.'
            },
            'featured-initiatives': {
                title: 'No Featured Initiatives Found',
                message: 'Featured initiatives data is not available at the moment.'
            },
            'research-areas': {
                title: 'No Research Areas Found',
                message: 'Research areas data is not available at the moment.'
            }
        };

        const config = messages[type] || { title: 'No Results', message: 'No data available.' };

        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="database"></i>
                </div>
                <h3 class="empty-state-title">${this.escapeHtml(config.title)}</h3>
                <p class="empty-state-message">${this.escapeHtml(config.message)}</p>
            </div>
        `;
    }

    showError(message) {
        if (this.isDestroyed) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.textContent = this.escapeHtml(message);

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Utility functions
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sanitizeUrl(url) {
        if (typeof url !== 'string') return '#';
        
        // Block dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
        for (const protocol of dangerousProtocols) {
            if (url.toLowerCase().startsWith(protocol)) {
                return '#';
            }
        }
        
        try {
            const urlObj = new URL(url);
            if (!['https:', 'http:'].includes(urlObj.protocol)) {
                return '#';
            }
            
            // Block localhost/private networks for security
            const hostname = urlObj.hostname.toLowerCase();
            if (hostname === 'localhost' || 
                hostname.startsWith('127.') || 
                hostname.startsWith('192.168.') || 
                hostname.startsWith('10.') || 
                hostname.startsWith('172.')) {
                return '#';
            }
            
            return url;
        } catch {
            return '#';
        }
    }

    truncateText(text, maxLength) {
        if (typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    formatDateRange(startDate, endDate) {
        try {
            const start = startDate ? this.formatDate(startDate) : 'Unknown';
            const end = endDate ? this.formatDate(endDate) : 'Ongoing';
            return `${start} - ${end}`;
        } catch (error) {
            return 'Unknown';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            return date.toLocaleDateString('en-EU', {
                year: 'numeric',
                month: 'short'
            });
        } catch (error) {
            return dateString;
        }
    }

    getInstitutionIcon(type) {
        const icons = {
            'university': 'graduation-cap',
            'research': 'microscope',
            'industry': 'building-2'
        };
        return icons[type] || 'building-2';
    }

    getResourceIcon(type) {
        const icons = {
            'report': 'file-text',
            'dataset': 'database',
            'tool': 'settings',
            'paper': 'scroll',
            'framework': 'layers',
            'platform': 'globe',
            'benchmark': 'target',
            'model': 'brain'
        };
        return icons[type] || 'file-text';
    }

    getTypeColor(type) {
        const colors = {
            'university': 'blue',
            'research': 'green',
            'industry': 'purple',
            'paper': 'blue',
            'dataset': 'green',
            'tool': 'purple',
            'report': 'orange',
            'LLM': 'blue',
            'VLM': 'purple'
        };
        return colors[type] || 'gray';
    }

    getStatusColor(status) {
        const colors = {
            'active': 'green',
            'completed': 'blue',
            'planned': 'yellow',
            'released': 'green',
            'research': 'orange'
        };
        return colors[status] || 'gray';
    }

    // Featured sections rendering
    async renderFeaturedInitiatives() {
        const container = document.getElementById('featured-initiatives-content');
        if (!container || this.isDestroyed) return;

        try {
            // Load featured initiatives data
            const response = await this.fetchWithTimeout('data/featured-initiatives.json', 5000);
            const data = await response.json();
            
            if (!data.initiatives || !Array.isArray(data.initiatives)) {
                container.innerHTML = this.getEmptyState('featured-initiatives');
                return;
            }

            // Render featured initiatives content
            container.innerHTML = data.initiatives.map(initiative => `
                <div class="content-card" id="initiative-${initiative.id}">
                    <div class="card-header">
                        <div class="card-icon">
                            <i data-lucide="${initiative.icon}"></i>
                        </div>
                        <div class="card-title-section">
                            <h2 class="card-title">${this.escapeHtml(initiative.title)}</h2>
                            <div class="card-tags">
                                ${initiative.tags.map(tag => `<span class="card-tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        <p class="card-description">${this.escapeHtml(initiative.description)}</p>
                        
                        <div class="card-stats">
                            <div class="stat-item">
                                <span class="stat-label">Established</span>
                                <span class="stat-value">${this.escapeHtml(initiative.details.established)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Funding</span>
                                <span class="stat-value">${this.escapeHtml(initiative.details.funding)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Members</span>
                                <span class="stat-value">${this.escapeHtml(initiative.details.members)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Countries</span>
                                <span class="stat-value">${this.escapeHtml(initiative.details.countries)}</span>
                            </div>
                        </div>

                        <div class="card-section">
                            <h3 class="section-title">Key Achievements</h3>
                            <ul class="achievement-list">
                                ${initiative.details.key_achievements.map(achievement => `
                                    <li class="achievement-item">${this.escapeHtml(achievement)}</li>
                                `).join('')}
                            </ul>
                        </div>

                        <div class="card-section">
                            <h3 class="section-title">Focus Areas</h3>
                            <div class="focus-areas-grid">
                                ${initiative.details.focus_areas.map(area => `
                                    <span class="focus-area-tag">${this.escapeHtml(area)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <div class="card-actions">
                            <a href="${this.sanitizeUrl(initiative.website)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                                <i data-lucide="external-link"></i>
                                Visit Website
                            </a>
                            ${initiative.youtube ? `
                                <a href="${this.sanitizeUrl(initiative.youtube)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                                    <i data-lucide="youtube"></i>
                                    YouTube Channel
                                </a>
                            ` : ''}
                            <a href="mailto:${this.escapeHtml(initiative.contact.email)}" class="btn btn-outline">
                                <i data-lucide="mail"></i>
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');

            // Reinitialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (error) {
            window.logger.error('Error loading featured initiatives:', error);
            container.innerHTML = this.getEmptyState('featured-initiatives');
        }
    }

    async renderResearchAreas() {
        const container = document.getElementById('research-areas-content');
        if (!container || this.isDestroyed) return;

        try {
            // Load research areas data
            const response = await this.fetchWithTimeout('data/research-areas.json', 5000);
            const data = await response.json();
            
            if (!data.research_areas || !Array.isArray(data.research_areas)) {
                container.innerHTML = this.getEmptyState('research-areas');
                return;
            }

            // Render research areas content
            container.innerHTML = data.research_areas.map(area => `
                <div class="content-card" id="area-${area.id}">
                    <div class="card-header">
                        <div class="card-icon" style="background-color: ${area.color}">
                            <i data-lucide="${area.icon}"></i>
                        </div>
                        <div class="card-title-section">
                            <h2 class="card-title">${this.escapeHtml(area.title)}</h2>
                            <div class="card-tags">
                                ${area.tags.map(tag => `<span class="card-tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        <p class="card-description">${this.escapeHtml(area.overview)}</p>
                        
                        <div class="card-section">
                            <h3 class="section-title">Key Topics</h3>
                            <div class="focus-areas-grid">
                                ${area.key_topics.map(topic => `
                                    <span class="focus-area-tag">${this.escapeHtml(topic)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <div class="card-section">
                            <h3 class="section-title">Featured YouTube Channels</h3>
                            <div class="channels-grid">
                                ${area.featured_channels.slice(0, 3).map(channel => `
                                    <div class="channel-card">
                                        <div class="channel-header">
                                            <div class="channel-avatar">${channel.name.charAt(0)}</div>
                                            <div class="channel-info">
                                                <h4 class="channel-name">${this.escapeHtml(channel.name)}</h4>
                                                <p class="channel-subs">${this.escapeHtml(channel.subscribers)} subscribers</p>
                                            </div>
                                        </div>
                                        <p class="channel-desc">${this.escapeHtml(channel.description)}</p>
                                        <div class="channel-actions">
                                            <a href="${this.sanitizeUrl(channel.youtube_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                                                <i data-lucide="youtube"></i>
                                                Visit Channel
                                            </a>
                                            <a href="${this.sanitizeUrl(channel.featured_playlist.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                                                <i data-lucide="play-circle"></i>
                                                ${this.escapeHtml(channel.featured_playlist.title)}
                                            </a>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        ${area.courses ? `
                            <div class="card-section">
                                <h3 class="section-title">Recommended Courses</h3>
                                <div class="courses-grid">
                                    ${area.courses.map(course => `
                                        <div class="course-card">
                                            <div class="course-header">
                                                <i data-lucide="graduation-cap"></i>
                                                <div>
                                                    <h4 class="course-title">${this.escapeHtml(course.title)}</h4>
                                                    <p class="course-meta">${this.escapeHtml(course.institution)} • ${this.escapeHtml(course.level)}</p>
                                                </div>
                                            </div>
                                            <p class="course-instructor">Instructor: ${this.escapeHtml(course.instructor)}</p>
                                            <div class="course-actions">
                                                <a href="${this.sanitizeUrl(course.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
                                                    <i data-lucide="external-link"></i>
                                                    Access Course
                                                </a>
                                                ${course.youtube_playlist ? `
                                                    <a href="${this.sanitizeUrl(course.youtube_playlist)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                                                        <i data-lucide="youtube"></i>
                                                        YouTube
                                                    </a>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');

            // Reinitialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (error) {
            window.logger.error('Error loading research areas:', error);
            container.innerHTML = this.getEmptyState('research-areas');
        }
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        this.isDestroyed = true;

        try {
            // Cancel any pending requests
            if (this.abortController) {
                this.abortController.abort();
            }

            // Remove event listeners
            for (const [element, listeners] of this.eventListeners) {
                if (element && listeners) {
                    listeners.forEach(({ event, handler }) => {
                        try {
                            element.removeEventListener(event, handler);
                        } catch (error) {
                            window.logger.warn('Error removing event listener:', error);
                        }
                    });
                }
            }
            this.eventListeners.clear();

            // Clear data
            this.data = null;
            this.loadedSections.clear();
            
            // Clear search managers
            if (window.institutionsSearchManager) {
                window.institutionsSearchManager.destroy();
            }
            if (window.projectsSearchManager) {
                window.projectsSearchManager.destroy();
            }
            if (window.resourcesSearchManager) {
                window.resourcesSearchManager.destroy();
            }
            if (window.modelsSearchManager) {
                window.modelsSearchManager.destroy();
            }
            
            window.logger.log('European GenAI Hub destroyed successfully');
        } catch (error) {
            window.logger.error('Error during cleanup:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EUGenAIHub();
    window.euGenAIHub = window.app; // Expose for command palette
});

// Handle window beforeunload for cleanup
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.destroy) {
        window.app.destroy();
    }
});