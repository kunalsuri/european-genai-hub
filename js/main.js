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
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;

            // Update navigation active state
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === sectionName) {
                    link.classList.add('active');
                }
            });

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
                case 'news':
                    this.renderNews();
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

        // Animate counters
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
            <div class="content-card fade-in">
                <h3>${this.escapeHtml(institution.name)}</h3>
                <div class="meta">
                    <strong>Country:</strong> ${this.escapeHtml(institution.country)}<br>
                    <strong>Type:</strong> ${this.escapeHtml(institution.type)}<br>
                    <strong>Focus:</strong> ${this.escapeHtml(institution.focus)}
                </div>
                <p>${this.escapeHtml(institution.description)}</p>
                <div class="tags">
                    ${institution.research_areas.map(area => 
                        `<span class="tag">${this.escapeHtml(area)}</span>`
                    ).join('')}
                </div>
                ${institution.website ? `
                    <div style="margin-top: 1rem;">
                        <a href="${this.escapeHtml(institution.website)}" target="_blank" class="btn btn-primary">
                            Visit Website
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');

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
            <div class="content-card fade-in">
                <h3>${this.escapeHtml(project.title)}</h3>
                <div class="meta">
                    <strong>Status:</strong> <span class="tag ${project.status}">${this.escapeHtml(project.status)}</span><br>
                    <strong>Duration:</strong> ${this.escapeHtml(project.start_date)} - ${this.escapeHtml(project.end_date)}<br>
                    <strong>Funding:</strong> €${this.formatNumber(project.funding)}
                </div>
                <p>${this.escapeHtml(project.description)}</p>
                <div class="tags">
                    ${project.research_areas.map(area => 
                        `<span class="tag secondary">${this.escapeHtml(area)}</span>`
                    ).join('')}
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Partners:</strong> ${project.partners.map(partner => 
                        this.escapeHtml(partner)
                    ).join(', ')}
                </div>
            </div>
        `).join('');

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
            <div class="content-card fade-in">
                <h3>${this.escapeHtml(resource.title)}</h3>
                <div class="meta">
                    <strong>Type:</strong> <span class="tag primary">${this.escapeHtml(resource.type)}</span><br>
                    <strong>Year:</strong> ${this.escapeHtml(resource.year)}<br>
                    <strong>Authors:</strong> ${resource.authors.map(author => 
                        this.escapeHtml(author)
                    ).join(', ')}
                </div>
                <p>${this.escapeHtml(resource.description)}</p>
                <div class="tags">
                    ${resource.keywords.map(keyword => 
                        `<span class="tag">${this.escapeHtml(keyword)}</span>`
                    ).join('')}
                </div>
                ${resource.url ? `
                    <div style="margin-top: 1rem;">
                        <a href="${this.escapeHtml(resource.url)}" target="_blank" class="btn btn-primary">
                            Access Resource
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Populate filter options
        this.populateFilterOptions('resources-filter-year', 
            [...new Set(this.data.resources.map(res => res.year))].sort().reverse());
    }

    renderNews() {
        const container = document.getElementById('news-grid');
        if (!container) return;

        if (this.data.news.length === 0) {
            container.innerHTML = this.getEmptyState('news');
            return;
        }

        // Sort news by date (newest first)
        const sortedNews = this.data.news.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedNews.map(article => `
            <div class="content-card fade-in">
                <h3>${this.escapeHtml(article.title)}</h3>
                <div class="meta">
                    <strong>Date:</strong> ${this.formatDate(article.date)}<br>
                    <strong>Category:</strong> <span class="tag ${article.category}">${this.escapeHtml(article.category)}</span>
                </div>
                <p>${this.escapeHtml(article.summary)}</p>
                ${article.tags && article.tags.length > 0 ? `
                    <div class="tags">
                        ${article.tags.map(tag => 
                            `<span class="tag">${this.escapeHtml(tag)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                ${article.url ? `
                    <div style="margin-top: 1rem;">
                        <a href="${this.escapeHtml(article.url)}" target="_blank" class="btn btn-primary">
                            Read More
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');
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
