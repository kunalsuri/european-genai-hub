/**
 * Content loading and rendering functions for European GenAI Hub
 * Handles data fetching and dynamic content generation
 */
'use strict';

// Load featured initiatives from JSON
async function loadFeaturedInitiatives() {
    try {
        const response = await fetch('data/featured-initiatives.json');
        const data = await response.json();
        renderFeaturedInitiatives(data.initiatives);
    } catch (error) {
        console.error('Error loading featured initiatives:', error);
        const grid = document.getElementById('featured-initiatives-grid');
        if (grid) {
            grid.innerHTML = '<p>Error loading featured initiatives</p>';
        }
    }
}

// Render featured initiatives
function renderFeaturedInitiatives(initiatives) {
    const grid = document.getElementById('featured-initiatives-grid');
    if (!grid) return;

    grid.innerHTML = initiatives.map(initiative => `
        <div class="project-card hover-lift" data-project="${initiative.id}" data-initiative-id="${initiative.id}">
            <div class="project-icon">
                <i data-lucide="${initiative.icon}"></i>
            </div>
            <div class="project-content">
                <h3 class="project-title">${initiative.title}</h3>
                <p class="project-description">${initiative.description}</p>
                <div class="project-meta">
                    ${initiative.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                </div>
                <div class="project-link">
                    <span>Learn More</span>
                    <i data-lucide="external-link"></i>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for initiative cards
    grid.querySelectorAll('[data-initiative-id]').forEach(card => {
        card.addEventListener('click', (e) => {
            const initiativeId = card.getAttribute('data-initiative-id');
            openFeaturedPage(initiativeId);
        });
    });

    // Re-create icons after rendering
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Open featured page
function openFeaturedPage(initiativeId) {
    // Navigate to featured-initiatives section and scroll to specific item
    navigateToSection('featured-initiatives');
    setTimeout(() => {
        const element = document.getElementById(`initiative-${initiativeId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

// Load research areas from JSON
async function loadResearchAreas() {
    try {
        const response = await fetch('data/research-areas.json');
        const data = await response.json();
        renderResearchAreas(data.research_areas);
    } catch (error) {
        console.error('Error loading research areas:', error);
        const grid = document.getElementById('research-areas-grid');
        if (grid) {
            grid.innerHTML = '<p>Error loading research areas</p>';
        }
    }
}

// Render research areas
function renderResearchAreas(areas) {
    const grid = document.getElementById('research-areas-grid');
    if (!grid) return;

    grid.innerHTML = areas.map(area => `
        <div class="project-card hover-lift" data-research-area="${area.id}" data-area-id="${area.id}">
            <div class="project-icon">
                <i data-lucide="${area.icon}"></i>
            </div>
            <div class="project-content">
                <h3 class="project-title">${area.title}</h3>
                <p class="project-description">${area.description}</p>
                <div class="project-meta">
                    ${area.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                </div>
                <div class="project-link">
                    <span>Explore Resources</span>
                    <i data-lucide="external-link"></i>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for research area cards
    grid.querySelectorAll('[data-area-id]').forEach(card => {
        card.addEventListener('click', (e) => {
            const areaId = card.getAttribute('data-area-id');
            openResearchAreaPage(areaId);
        });
    });

    // Re-create icons after rendering
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Open research area page
function openResearchAreaPage(areaId) {
    // Navigate to research-areas section and scroll to specific item
    navigateToSection('research-areas');
    setTimeout(() => {
        const element = document.getElementById(`area-${areaId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

// Navigation function
function navigateToSection(sectionId) {
    // Use the main app navigation if available, otherwise fallback to inline navigation
    if (window.app && window.app.showSection) {
        window.app.showSection(sectionId);
        return;
    }
    
    // Fallback inline navigation
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll('.nav-dropdown-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Load detailed featured initiatives content
async function loadDetailedFeaturedInitiatives() {
    try {
        const response = await fetch('data/featured-initiatives.json');
        const data = await response.json();
        renderDetailedFeaturedInitiatives(data.initiatives);
    } catch (error) {
        console.error('Error loading detailed featured initiatives:', error);
    }
}

// Render detailed featured initiatives
function renderDetailedFeaturedInitiatives(initiatives) {
    const container = document.getElementById('featured-initiatives-content');
    if (!container) return;

    container.innerHTML = initiatives.map(initiative => `
        <div class="content-card" id="initiative-${initiative.id}">
            <div class="card-header">
                <div class="card-icon">
                    <i data-lucide="${initiative.icon}"></i>
                </div>
                <div class="card-title-section">
                    <h2 class="card-title">${initiative.title}</h2>
                    <div class="card-tags">
                        ${initiative.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="card-content">
                <p class="card-description">${initiative.description}</p>
                
                <div class="card-stats">
                    <div class="stat-item">
                        <span class="stat-label">Established</span>
                        <span class="stat-value">${initiative.details.established}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Funding</span>
                        <span class="stat-value">${initiative.details.funding}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Members</span>
                        <span class="stat-value">${initiative.details.members}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Countries</span>
                        <span class="stat-value">${initiative.details.countries}</span>
                    </div>
                </div>

                <div class="card-section">
                    <h3 class="section-title">Key Achievements</h3>
                    <ul class="achievement-list">
                        ${initiative.details.key_achievements.map(achievement => `
                            <li class="achievement-item">${achievement}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="card-section">
                    <h3 class="section-title">Focus Areas</h3>
                    <div class="focus-areas-grid">
                        ${initiative.details.focus_areas.map(area => `
                            <span class="focus-area-tag">${area}</span>
                        `).join('')}
                    </div>
                </div>

                <div class="card-actions">
                    <a href="${initiative.website}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                        <i data-lucide="external-link"></i>
                        Visit Website
                    </a>
                    ${initiative.youtube ? `
                        <a href="${initiative.youtube}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                            <i data-lucide="youtube"></i>
                            YouTube Channel
                        </a>
                    ` : ''}
                    <a href="mailto:${initiative.contact.email}" class="btn btn-outline">
                        <i data-lucide="mail"></i>
                        Contact
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // Re-create icons after rendering
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Load detailed research areas content
async function loadDetailedResearchAreas() {
    try {
        const response = await fetch('data/research-areas.json');
        const data = await response.json();
        renderDetailedResearchAreas(data.research_areas);
    } catch (error) {
        console.error('Error loading detailed research areas:', error);
    }
}

// Render detailed research areas
function renderDetailedResearchAreas(areas) {
    const container = document.getElementById('research-areas-content');
    if (!container) return;

    container.innerHTML = areas.map(area => `
        <div class="content-card" id="area-${area.id}">
            <div class="card-header">
                <div class="card-icon" style="background-color: ${area.color}">
                    <i data-lucide="${area.icon}"></i>
                </div>
                <div class="card-title-section">
                    <h2 class="card-title">${area.title}</h2>
                    <div class="card-tags">
                        ${area.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="card-content">
                <p class="card-description">${area.overview}</p>
                
                <div class="card-section">
                    <h3 class="section-title">Key Topics</h3>
                    <div class="focus-areas-grid">
                        ${area.key_topics.map(topic => `
                            <span class="focus-area-tag">${topic}</span>
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
                                        <h4 class="channel-name">${channel.name}</h4>
                                        <p class="channel-subs">${channel.subscribers} subscribers</p>
                                    </div>
                                </div>
                                <p class="channel-desc">${channel.description}</p>
                                <div class="channel-actions">
                                    <a href="${channel.youtube_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                                        <i data-lucide="youtube"></i>
                                        Visit Channel
                                    </a>
                                    <a href="${channel.featured_playlist.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                                        <i data-lucide="play-circle"></i>
                                        ${channel.featured_playlist.title}
                                    </a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card-section">
                    <h3 class="section-title">Recommended Courses</h3>
                    <div class="courses-grid">
                        ${area.courses.map(course => `
                            <div class="course-card">
                                <div class="course-header">
                                    <i data-lucide="graduation-cap"></i>
                                    <div>
                                        <h4 class="course-title">${course.title}</h4>
                                        <p class="course-meta">${course.institution} • ${course.level}</p>
                                    </div>
                                </div>
                                <p class="course-instructor">Instructor: ${course.instructor}</p>
                                <div class="course-actions">
                                    <a href="${course.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
                                        <i data-lucide="external-link"></i>
                                        Access Course
                                    </a>
                                    ${course.youtube_playlist ? `
                                        <a href="${course.youtube_playlist}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                                            <i data-lucide="youtube"></i>
                                            YouTube
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card-section">
                    <h3 class="section-title">Essential Papers</h3>
                    <div class="papers-grid">
                        ${area.papers.map(paper => `
                            <div class="paper-card">
                                <div class="paper-header">
                                    <i data-lucide="file-text"></i>
                                    <div>
                                        <h4 class="paper-title">${paper.title}</h4>
                                        <p class="paper-meta">${paper.authors} • ${paper.year}</p>
                                    </div>
                                </div>
                                <p class="paper-description">${paper.description}</p>
                                <a href="${paper.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                                    <i data-lucide="external-link"></i>
                                    Read Paper
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card-section">
                    <h3 class="section-title">Tools & Libraries</h3>
                    <div class="tools-grid">
                        ${area.tools.map(tool => `
                            <div class="tool-card">
                                <div class="tool-header">
                                    <i data-lucide="wrench"></i>
                                    <div>
                                        <h4 class="tool-title">${tool.name}</h4>
                                        <p class="tool-type">${tool.type}</p>
                                    </div>
                                </div>
                                <p class="tool-description">${tool.description}</p>
                                <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                                    <i data-lucide="external-link"></i>
                                    Explore Tool
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Re-create icons after rendering
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
