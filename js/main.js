// Main application JavaScript
class EUGenAIHub {
    constructor() {
        this.currentSection = 'home';
        this.data = {
            institutions: [],
            projects: [],
            resources: [],
            news: []
        };
        this.init();
    }

    async init() {
        try {
            // Load all data
            await this.loadData();
            
            // Initialize components
            this.initNavigation();
            this.initStats();
            this.initSearch();
            
            // Initialize sections
            this.showSection('home');
            
            console.log('EU GenAI Hub initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to load application data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            const [institutions, projects, resources, news] = await Promise.all([
                fetch('data/institutions.json').then(r => r.json()).catch(() => []),
                fetch('data/projects.json').then(r => r.json()).catch(() => []),
                fetch('data/resources.json').then(r => r.json()).catch(() => []),
                fetch('data/news.json').then(r => r.json()).catch(() => [])
            ]);

            this.data = { institutions, projects, resources, news };
        } catch (error) {
            console.error('Error loading data:', error);
            // Initialize with empty arrays to prevent errors
            this.data = {
                institutions: [],
                projects: [],
                resources: [],
                news: []
            };
        }
    }

    initNavigation() {
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Hero buttons
        const heroButtons = document.querySelectorAll('[data-section]');
        heroButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.dataset.section;
                this.showSection(section);
            });
        });

        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    showSection(sectionName) {
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
            const navLinks = document.querySelectorAll('.nav-link');
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

            // Load section content
            this.loadSectionContent(sectionName);
        }
    }

    async loadSectionContent(sectionName) {
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
            }
        } catch (error) {
            console.error(`Error loading ${sectionName} content:`, error);
        }
    }

    initStats() {
        if (!this.data) return;

        // Calculate statistics
        const stats = {
            institutions: this.data.institutions.length,
            projects: this.data.projects.length,
            resources: this.data.resources.length,
            countries: new Set(this.data.institutions.map(inst => inst.country)).size
        };

        // Calculate total resources for AIOD-style display
        const totalResources = stats.institutions + stats.projects + stats.resources;

        // Animate counters
        this.animateCounter('total-resources-count', totalResources);
        this.animateCounter('institutions-count', stats.institutions);
        this.animateCounter('projects-count', stats.projects);
        this.animateCounter('resources-count', stats.resources);
        this.animateCounter('countries-count', stats.countries);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = targetValue / 100;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 20);
    }

    renderInstitutions() {
        const container = document.getElementById('institutions-grid');
        if (!container) return;

        if (this.data.institutions.length === 0) {
            container.innerHTML = this.getEmptyState('institutions');
            return;
        }

        container.innerHTML = this.data.institutions.map(institution => `
            <div class="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div class="p-8">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <div class="w-12 h-12 bg-gradient-to-br from-eu-blue to-accent-purple rounded-2xl flex items-center justify-center">
                                    <i data-lucide="${this.getInstitutionIcon(institution.type)}" class="w-6 h-6 text-white"></i>
                                </div>
                                <span class="px-3 py-1 bg-${this.getTypeColor(institution.type)}/10 text-${this.getTypeColor(institution.type)} text-sm font-medium rounded-full">
                                    ${institution.type}
                                </span>
                            </div>
                            <h3 class="text-xl font-space font-bold text-slate-900 mb-2 group-hover:text-eu-blue transition-colors">
                                ${this.escapeHtml(institution.name)}
                            </h3>
                        </div>
                    </div>
                    
                    <div class="flex items-center text-slate-600 mb-4">
                        <i data-lucide="map-pin" class="w-4 h-4 mr-2"></i>
                        <span class="text-sm">${this.escapeHtml(institution.city)}, ${this.escapeHtml(institution.country)}</span>
                    </div>
                    
                    <p class="text-slate-600 leading-relaxed mb-6">
                        ${this.escapeHtml(institution.description)}
                    </p>
                    
                    ${institution.research_areas ? `
                        <div class="flex flex-wrap gap-2 mb-6">
                            ${institution.research_areas.slice(0, 3).map(area => 
                                `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                    ${this.escapeHtml(area)}
                                </span>`
                            ).join('')}
                            ${institution.research_areas.length > 3 ? 
                                `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                    +${institution.research_areas.length - 3} more
                                </span>` : ''
                            }
                        </div>
                    ` : ''}
                    
                    <a href="${institution.website}" target="_blank" 
                       class="inline-flex items-center justify-center w-full bg-gradient-to-r from-eu-blue to-accent-purple text-white px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-all duration-300 group">
                        <span>Visit Website</span>
                        <i data-lucide="external-link" class="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform"></i>
                    </a>
                </div>
            </div>
        `).join('');
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Populate filter options
        this.populateFilterOptions('institutions-filter-country', 
            [...new Set(this.data.institutions.map(inst => inst.country))]);
    }

    renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        if (this.data.projects.length === 0) {
            container.innerHTML = this.getEmptyState('projects');
            return;
        }

        container.innerHTML = this.data.projects.map(project => `
            <div class="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div class="p-8">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-xl flex items-center justify-center">
                                    <i data-lucide="rocket" class="w-5 h-5 text-white"></i>
                                </div>
                                <span class="px-3 py-1 bg-${this.getStatusColor(project.status)}/10 text-${this.getStatusColor(project.status)} text-sm font-semibold rounded-full">
                                    ${project.status}
                                </span>
                            </div>
                            <h3 class="text-2xl font-space font-bold text-slate-900 mb-4 leading-tight">
                                ${this.escapeHtml(project.title)}
                            </h3>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="flex items-center text-slate-600">
                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                            <span class="text-sm">${this.formatDate(project.start_date)} - ${this.formatDate(project.end_date)}</span>
                        </div>
                        <div class="flex items-center text-slate-600">
                            <i data-lucide="euro" class="w-4 h-4 mr-2"></i>
                            <span class="text-sm font-semibold">${project.funding}</span>
                        </div>
                    </div>

                    <p class="text-slate-600 leading-relaxed mb-6">
                        ${this.escapeHtml(project.description)}
                    </p>

                    ${project.technologies ? `
                        <div class="mb-6">
                            <h4 class="text-sm font-semibold text-slate-700 mb-3">Key Technologies</h4>
                            <div class="flex flex-wrap gap-2">
                                ${project.technologies.slice(0, 3).map(tech => 
                                    `<span class="px-3 py-1 bg-accent-cyan/10 text-accent-cyan text-xs font-medium rounded-full">
                                        ${this.escapeHtml(tech)}
                                    </span>`
                                ).join('')}
                                ${project.technologies.length > 3 ? 
                                    `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                        +${project.technologies.length - 3} more
                                    </span>` : ''
                                }
                            </div>
                        </div>
                    ` : ''}

                    ${project.participants ? `
                        <div class="pt-6 border-t border-slate-100">
                            <h4 class="text-sm font-semibold text-slate-700 mb-3">Research Partners</h4>
                            <div class="flex flex-wrap gap-2">
                                ${project.participants.slice(0, 4).map(partner => 
                                    `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                                        ${this.escapeHtml(partner)}
                                    </span>`
                                ).join('')}
                                ${project.participants.length > 4 ? 
                                    `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                                        +${project.participants.length - 4} more
                                    </span>` : ''
                                }
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

        // Populate filter options
        this.populateFilterOptions('projects-filter-area', 
            [...new Set(this.data.projects.flatMap(proj => proj.research_areas))]);
    }

    renderResources() {
        const container = document.getElementById('resources-grid');
        if (!container) return;

        if (this.data.resources.length === 0) {
            container.innerHTML = this.getEmptyState('resources');
            return;
        }

        container.innerHTML = this.data.resources.map(resource => `
            <div class="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div class="p-8">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl flex items-center justify-center">
                                    <i data-lucide="${this.getResourceIcon(resource.type)}" class="w-5 h-5 text-white"></i>
                                </div>
                                <span class="px-3 py-1 bg-${this.getTypeColor(resource.type)}/10 text-${this.getTypeColor(resource.type)} text-sm font-semibold rounded-full">
                                    ${resource.type}
                                </span>
                            </div>
                            <h3 class="text-2xl font-space font-bold text-slate-900 mb-4 leading-tight">
                                ${this.escapeHtml(resource.title)}
                            </h3>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="flex items-center text-slate-600">
                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                            <span class="text-sm">${resource.year}</span>
                        </div>
                        <div class="flex items-center text-slate-600">
                            <i data-lucide="building" class="w-4 h-4 mr-2"></i>
                            <span class="text-sm">${this.escapeHtml(resource.institution)}</span>
                        </div>
                    </div>

                    <p class="text-slate-600 leading-relaxed mb-6">
                        ${this.escapeHtml(resource.description)}
                    </p>

                    ${resource.keywords ? `
                        <div class="mb-6">
                            <h4 class="text-sm font-semibold text-slate-700 mb-3">Keywords</h4>
                            <div class="flex flex-wrap gap-2">
                                ${resource.keywords.slice(0, 3).map(keyword => 
                                    `<span class="px-3 py-1 bg-accent-cyan/10 text-accent-cyan text-xs font-medium rounded-full">
                                        ${this.escapeHtml(keyword)}
                                    </span>`
                                ).join('')}
                                ${resource.keywords.length > 3 ? 
                                    `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                        +${resource.keywords.length - 3} more
                                    </span>` : ''
                                }
                            </div>
                        </div>
                    ` : ''}

                    ${resource.authors ? `
                        <div class="pt-6 border-t border-slate-100">
                            <h4 class="text-sm font-semibold text-slate-700 mb-3">Authors</h4>
                            <div class="flex flex-wrap gap-2">
                                ${resource.authors.slice(0, 3).map(author => 
                                    `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                                        ${this.escapeHtml(author)}
                                    </span>`
                                ).join('')}
                                ${resource.authors.length > 3 ? 
                                    `<span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                                        +${resource.authors.length - 3} more
                                    </span>` : ''
                                }
                            </div>
                        </div>
                    ` : ''}

                    ${resource.url ? `
                        <div class="mt-6">
                            <a href="${this.escapeHtml(resource.url)}" target="_blank" class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-eu-blue to-accent-purple text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300">
                                <i data-lucide="external-link" class="w-4 h-4 mr-2"></i>
                                Access Resource
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Populate filter options
        this.populateFilterOptions('resources-filter-year', 
            [...new Set(this.data.resources.map(res => res.year))].sort().reverse());
    }



    populateFilterOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Keep the "All" option and add new options
        const currentOptions = Array.from(select.options).slice(1);
        currentOptions.forEach(option => option.remove());

        options.sort().forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }

    initSearch() {
        // Initialize search functionality for each section
        if (window.SearchManager) {
            window.SearchManager.init(this.data);
        }
    }

    getEmptyState(type) {
        const messages = {
            institutions: {
                title: 'No Institutions Found',
                message: 'No research institutions match your current filters.'
            },
            projects: {
                title: 'No Projects Found',
                message: 'No research projects match your current filters.'
            },
            resources: {
                title: 'No Resources Found',
                message: 'No research resources match your current filters.'
            },
            news: {
                title: 'No News Found',
                message: 'No news articles match your current filters.'
            }
        };

        const config = messages[type] || { title: 'No Results', message: 'No data available.' };

        return `
            <div class="empty-state">
                <h3>${config.title}</h3>
                <p>${config.message}</p>
            </div>
        `;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            z-index: 1001;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Utility functions
    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString();
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-EU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
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
            'tool': 'tool',
            'paper': 'scroll',
            'framework': 'layers'
        };
        return icons[type] || 'library';
    }

    getTypeColor(type) {
        const colors = {
            'university': 'blue-600',
            'research': 'green-600',
            'industry': 'purple-600'
        };
        return colors[type] || 'slate-600';
    }

    getStatusColor(status) {
        const colors = {
            'active': 'green-600',
            'completed': 'blue-600',
            'planned': 'yellow-600'
        };
        return colors[status] || 'slate-600';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EUGenAIHub();
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    // Reinitialize map if it exists and is visible
    if (window.ResearchMap && document.getElementById('map').classList.contains('active')) {
        setTimeout(() => {
            window.ResearchMap.resizeMap();
        }, 100);
    }
});
