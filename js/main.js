
// Main application JavaScript with security and performance improvements
'use strict';

class EUGenAIHub {
    constructor() {
        this.currentSection = 'home';
        this.data = {
            institutions: [],
            projects: [],
            resources: [],
            news: [],
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
            // Load minimal data first - only what's needed for the home page
            await this.loadHomeData();
            
            // Initialize components
            this.initNavigation();
            this.initStats();
            
            // Show home section
            this.showSection('home');
            
            console.log('EU GenAI Hub initialized successfully');
            
            // Load other data in background
            this.loadRemainingDataInBackground();
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to load application data. Please refresh the page.');
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
            console.error('Error loading home data:', error);
            this.data.institutions = [];
        }
    }

    async loadRemainingDataInBackground() {
        try {
            // Load non-critical data in background
            const [projects, resources, news, models] = await Promise.allSettled([
                this.fetchWithTimeout('data/projects.json', 5000).then(r => r.json()).catch(() => []),
                this.fetchWithTimeout('data/resources.json', 5000).then(r => r.json()).catch(() => []),
                this.fetchWithTimeout('data/news.json', 5000).then(r => r.json()).catch(() => []),
                this.fetchWithTimeout('data/models.json', 5000).then(r => r.json()).catch(() => [])
            ]);

            this.data.projects = this.sanitizeData(projects.status === 'fulfilled' ? projects.value : []);
            this.data.resources = this.sanitizeData(resources.status === 'fulfilled' ? resources.value : []);
            this.data.news = this.sanitizeData(news.status === 'fulfilled' ? news.value : []);
            this.data.models = this.sanitizeData(models.status === 'fulfilled' ? models.value : []);
            
            // Update stats after all data is loaded
            this.initStats();
        } catch (error) {
            console.error('Error loading background data:', error);
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
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link, .footer-link');
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
        const allowedSections = ['home', 'map', 'institutions', 'projects', 'models', 'resources'];
        if (!allowedSections.includes(sectionName)) {
            console.warn('Invalid section name:', sectionName);
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
                case 'map':
                    if (window.ResearchMap) {
                        window.ResearchMap.init(this.data.institutions);
                    }
                    break;
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
            }
            
            this.loadedSections.add(sectionName);
        } catch (error) {
            console.error(`Error loading ${sectionName} content:`, error);
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

        // Calculate total resources for display
        const totalResources = stats.institutions + stats.projects + stats.resources;

        // Animate counters with bounds checking
        this.animateCounter('total-resources-count', Math.min(totalResources, 9999));
        this.animateCounter('institutions-count', Math.min(stats.institutions, 9999));
        this.animateCounter('projects-count', Math.min(stats.projects, 9999));
        this.animateCounter('resources-count', Math.min(stats.resources, 9999));
        this.animateCounter('countries-count', Math.min(stats.countries, 99));
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
        
        // Initialize search for this section
        if (window.searchManager && this.data) {
            window.searchManager.init();
        }

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderInstitutionsGrid() {
        const container = document.getElementById('institutions-grid');
        if (!container || this.isDestroyed) return;

        container.innerHTML = this.data.institutions.map(institution => `
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
                        <div class="filter-group">
                            <i data-lucide="layers" class="filter-icon"></i>
                            <select id="projects-filter-area" class="filter-select" aria-label="Filter by research area">
                                <option value="all">All Research Areas</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div id="projects-grid" class="content-grid"></div>
            </div>
        `;

        this.renderProjectsGrid();
        
        // Initialize search
        if (window.searchManager && this.data) {
            window.searchManager.init();
        }

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderProjectsGrid() {
        const container = document.getElementById('projects-grid');
        if (!container || this.isDestroyed) return;

        container.innerHTML = this.data.projects.map(project => `
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
                    <div class="card-section">
                        <h4 class="card-section-title">Key Technologies</h4>
                        <div class="card-tags">
                            ${project.technologies.slice(0, 3).map(tech => 
                                `<span class="tag tag-primary">${this.escapeHtml(tech)}</span>`
                            ).join('')}
                            ${project.technologies.length > 3 ? 
                                `<span class="tag">+${project.technologies.length - 3} more</span>` : ''
                            }
                        </div>
                    </div>
                ` : ''}

                ${project.participants && Array.isArray(project.participants) ? `
                    <div class="card-section">
                        <h4 class="card-section-title">Research Partners</h4>
                        <div class="card-tags">
                            ${project.participants.slice(0, 4).map(partner => 
                                `<span class="tag">${this.escapeHtml(partner)}</span>`
                            ).join('')}
                            ${project.participants.length > 4 ? 
                                `<span class="tag">+${project.participants.length - 4} more</span>` : ''
                            }
                        </div>
                    </div>
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
                        <div class="filter-group">
                            <i data-lucide="calendar" class="filter-icon"></i>
                            <select id="resources-filter-year" class="filter-select" aria-label="Filter by year">
                                <option value="all">All Years</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div id="resources-grid" class="content-grid"></div>
            </div>
        `;

        this.renderResourcesGrid();
        this.populateFilterOptions('resources-filter-year', 
            [...new Set(this.data.resources.map(res => res.year).filter(Boolean))].sort().reverse());
        
        // Initialize search
        if (window.searchManager && this.data) {
            window.searchManager.init();
        }

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderResourcesGrid() {
        const container = document.getElementById('resources-grid');
        if (!container || this.isDestroyed) return;

        container.innerHTML = this.data.resources.map(resource => `
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
                    <div class="card-section">
                        <h4 class="card-section-title">Keywords</h4>
                        <div class="card-tags">
                            ${resource.keywords.slice(0, 3).map(keyword => 
                                `<span class="tag tag-primary">${this.escapeHtml(keyword)}</span>`
                            ).join('')}
                            ${resource.keywords.length > 3 ? 
                                `<span class="tag">+${resource.keywords.length - 3} more</span>` : ''
                            }
                        </div>
                    </div>
                ` : ''}

                ${resource.authors && Array.isArray(resource.authors) ? `
                    <div class="card-section">
                        <h4 class="card-section-title">Authors</h4>
                        <div class="card-tags">
                            ${resource.authors.slice(0, 3).map(author => 
                                `<span class="tag">${this.escapeHtml(author)}</span>`
                            ).join('')}
                            ${resource.authors.length > 3 ? 
                                `<span class="tag">+${resource.authors.length - 3} more</span>` : ''
                            }
                        </div>
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
                    <p class="section-description">
                        Comprehensive overview of Large Language Models and Vision-Language Models developed across European research initiatives
                    </p>
                </div>
                
                <div class="filter-wrapper">
                    <div class="filter-container">
                        <div class="filter-group">
                            <i data-lucide="search" class="filter-icon"></i>
                            <input type="text" id="models-search" placeholder="Search models, projects, or partners..." 
                                   class="filter-input" maxlength="100" autocomplete="off">
                        </div>
                        <div class="filter-group">
                            <i data-lucide="brain" class="filter-icon"></i>
                            <select id="models-filter-type" class="filter-select" aria-label="Filter by model type">
                                <option value="all">All Model Types</option>
                                <option value="LLM">Large Language Models</option>
                                <option value="VLM">Vision-Language Models</option>
                                <option value="Multimodal">Multimodal Models</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <i data-lucide="activity" class="filter-icon"></i>
                            <select id="models-filter-status" class="filter-select" aria-label="Filter by status">
                                <option value="all">All Status</option>
                                <option value="active">Active Development</option>
                                <option value="released">Released</option>
                                <option value="research">Research Phase</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="table-wrapper">
                    <div class="table-container">
                        <table class="models-table">
                            <thead class="table-header">
                                <tr>
                                    <th>Project Name</th>
                                    <th>Model Type</th>
                                    <th>Models Developed</th>
                                    <th>Key Partners</th>
                                    <th>Funding</th>
                                    <th>Status</th>
                                    <th>Languages</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody id="models-table-body">
                                <!-- Model data will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="table-note">
                    <p>Data based on the International Open-Source LLM Builders Summit held in Geneva during ITU's AI for Good</p>
                </div>
            </div>
        `;

        this.renderModelsTable();
        
        // Initialize search
        if (window.searchManager) {
            window.searchManager.init();
        }

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderModelsTable() {
        const tbody = document.getElementById('models-table-body');
        if (!tbody || this.isDestroyed) return;

        tbody.innerHTML = this.data.models.map(model => `
            <tr class="table-row">
                <td class="table-cell">
                    <div class="table-cell-main">${this.escapeHtml(model.project_name || 'Unknown')}</div>
                    <div class="table-cell-sub">${this.escapeHtml(model.year || 'Unknown')}</div>
                </td>
                <td class="table-cell">
                    <span class="table-badge table-badge-${this.getModelTypeColor(model.model_type)}">
                        ${this.escapeHtml(model.model_type || 'Unknown')}
                    </span>
                </td>
                <td class="table-cell">
                    <div class="table-tags">
                        ${Array.isArray(model.models_developed) ? 
                            model.models_developed.slice(0, 2).map(modelName => 
                                `<span class="table-tag">${this.escapeHtml(modelName)}</span>`
                            ).join('') : ''
                        }
                        ${Array.isArray(model.models_developed) && model.models_developed.length > 2 ? 
                            `<span class="table-tag">+${model.models_developed.length - 2}</span>` : ''
                        }
                    </div>
                </td>
                <td class="table-cell">
                    <div class="table-cell-content">
                        ${Array.isArray(model.key_partners) ? 
                            model.key_partners.slice(0, 2).map(partner => this.escapeHtml(partner)).join(', ') : 'Unknown'
                        }
                        ${Array.isArray(model.key_partners) && model.key_partners.length > 2 ? 
                            `<br><span class="table-cell-sub">+${model.key_partners.length - 2} more</span>` : ''
                        }
                    </div>
                </td>
                <td class="table-cell">
                    <div class="table-cell-main">${this.escapeHtml(model.funding || 'N/A')}</div>
                </td>
                <td class="table-cell">
                    <span class="table-badge table-badge-${this.getStatusColor(model.status)}">
                        ${this.escapeHtml(model.status || 'Unknown')}
                    </span>
                </td>
                <td class="table-cell">
                    <div class="table-cell-content">
                        ${Array.isArray(model.languages) ? 
                            model.languages.slice(0, 3).join(', ') : 'Unknown'
                        }
                        ${Array.isArray(model.languages) && model.languages.length > 3 ? 
                            `<br><span class="table-cell-sub">+${model.languages.length - 3} more</span>` : ''
                        }
                    </div>
                </td>
                <td class="table-cell">
                    ${model.url ? `
                        <a href="${this.sanitizeUrl(model.url)}" target="_blank" rel="noopener noreferrer"
                           class="table-link">
                            <i data-lucide="external-link"></i>
                            View
                        </a>
                    ` : ''}
                </td>
            </tr>
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

    // Utility functions with security improvements
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sanitizeUrl(url) {
        if (typeof url !== 'string') return '#';
        try {
            const urlObj = new URL(url);
            // Only allow https and http protocols
            if (!['https:', 'http:'].includes(urlObj.protocol)) {
                return '#';
            }
            return url;
        } catch {
            return '#';
        }
    }

    sanitizeUrl(url) {
        if (typeof url !== 'string') return '#';
        
        // Allow only http/https protocols
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return url;
            }
        } catch (e) {
            // Invalid URL
        }
        return '#';
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
            'tool': 'wrench',
            'paper': 'scroll',
            'framework': 'layers'
        };
        return icons[type] || 'file-text';
    }

    getModelTypeColor(type) {
        const colors = {
            'LLM': 'blue',
            'VLM': 'purple',
            'Multimodal': 'pink'
        };
        return colors[type] || 'gray';
    }

    getTypeColor(type) {
        const colors = {
            'university': 'blue',
            'research': 'green',
            'industry': 'purple',
            'paper': 'blue',
            'dataset': 'green',
            'tool': 'purple',
            'report': 'orange'
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

    // Cleanup method to prevent memory leaks
    destroy() {
        this.isDestroyed = true;
        
        // Cancel any pending requests
        this.abortController.abort();
        
        // Remove event listeners
        for (const [element, listeners] of this.eventListeners) {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        }
        this.eventListeners.clear();
        
        // Clear data
        this.data = null;
        this.loadedSections.clear();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EUGenAIHub();
});

// Handle window beforeunload for cleanup
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.destroy) {
        window.app.destroy();
    }
});

// Handle window resize for responsive behavior
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Reinitialize map if it exists and is visible
        if (window.ResearchMap && document.getElementById('map').classList.contains('active')) {
            window.ResearchMap.resizeMap();
        }
    }, 250);
});
