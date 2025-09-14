/**
 * Featured page script for European GenAI Hub
 * Handles individual initiative page functionality
 */
'use strict';

// Get initiative ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const initiativeId = urlParams.get('id');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    if (initiativeId) {
        loadInitiativeData(initiativeId);
    } else {
        showError('No initiative specified');
    }
});

// Load initiative data
async function loadInitiativeData(id) {
    try {
        const response = await fetch('../data/featured-initiatives.json');
        const data = await response.json();
        const initiative = data.initiatives.find(item => item.id === id);
        
        if (initiative) {
            renderInitiative(initiative);
        } else {
            showError('Initiative not found');
        }
    } catch (error) {
        console.error('Error loading initiative data:', error);
        showError('Error loading initiative data');
    }
}

// Render initiative content
function renderInitiative(initiative) {
    // Update page title
    document.title = `${initiative.title} | European GenAI Hub`;

    // Render hero section
    const heroContent = document.getElementById('hero-content');
    heroContent.innerHTML = `
        <h1 class="featured-title">${initiative.title}</h1>
        <p class="featured-subtitle">${initiative.description}</p>
        <div class="featured-tags">
            ${initiative.tags.map(tag => `<span class="featured-tag">${tag}</span>`).join('')}
        </div>
        <div class="featured-actions">
            <a href="${initiative.website}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg">
                <i data-lucide="external-link" class="btn-icon"></i>
                Visit Website
            </a>
            ${initiative.youtube ? `
                <a href="${initiative.youtube}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-lg">
                    <i data-lucide="youtube" class="btn-icon"></i>
                    YouTube Channel
                </a>
            ` : ''}
        </div>
    `;

    // Render main content
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <!-- Statistics -->
        <div class="featured-stats">
            <div class="featured-stat">
                <div class="featured-stat-value">${initiative.details.established}</div>
                <div class="featured-stat-label">Established</div>
            </div>
            <div class="featured-stat">
                <div class="featured-stat-value">${initiative.details.members}</div>
                <div class="featured-stat-label">Members</div>
            </div>
            <div class="featured-stat">
                <div class="featured-stat-value">${initiative.details.countries}</div>
                <div class="featured-stat-label">Countries</div>
            </div>
            <div class="featured-stat">
                <div class="featured-stat-value">${initiative.details.funding}</div>
                <div class="featured-stat-label">Funding</div>
            </div>
        </div>

        <!-- Main Grid -->
        <div class="featured-grid">
            <!-- Left Column -->
            <div>
                <!-- Focus Areas -->
                <div class="featured-section">
                    <h3>Focus Areas</h3>
                    <div class="featured-areas">
                        ${initiative.details.focus_areas.map(area => `
                            <div class="featured-area">${area}</div>
                        `).join('')}
                    </div>
                </div>

                <!-- Key Achievements -->
                <div class="featured-section">
                    <h3>Key Achievements</h3>
                    <ul class="featured-achievements">
                        ${initiative.details.key_achievements.map(achievement => `
                            <li>${achievement}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <!-- Right Column -->
            <div>
                <!-- Embedded Demo -->
                ${initiative.embedded_demo ? `
                    <div class="featured-section">
                        <h3>Live Demo</h3>
                        <div class="featured-embed">
                            <iframe src="${initiative.embedded_demo}" title="${initiative.title} Demo"></iframe>
                        </div>
                    </div>
                ` : ''}

                <!-- YouTube Video -->
                ${initiative.youtube ? `
                    <div class="featured-section">
                        <h3>YouTube Channel</h3>
                        <div class="featured-embed">
                            <iframe src="${getYouTubeEmbedUrl(initiative.youtube)}" title="${initiative.title} YouTube" allowfullscreen></iframe>
                        </div>
                    </div>
                ` : ''}

                <!-- Contact Information -->
                <div class="featured-section">
                    <h3>Contact & Links</h3>
                    <div class="featured-contact">
                        <a href="mailto:${initiative.contact.email}" class="featured-contact-item">
                            <i data-lucide="mail"></i>
                            Email
                        </a>
                        <a href="https://twitter.com/${initiative.contact.twitter}" target="_blank" rel="noopener noreferrer" class="featured-contact-item">
                            <i data-lucide="twitter"></i>
                            Twitter
                        </a>
                        <a href="https://linkedin.com/company/${initiative.contact.linkedin}" target="_blank" rel="noopener noreferrer" class="featured-contact-item">
                            <i data-lucide="linkedin"></i>
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Convert YouTube channel URL to embed URL
function getYouTubeEmbedUrl(channelUrl) {
    // For demo purposes, we'll embed a placeholder or the channel's main page
    // In production, you would need specific video IDs or playlist IDs
    const channelId = channelUrl.match(/youtube\.com\/(@[\w-]+|channel\/([\w-]+)|c\/([\w-]+))/);
    if (channelId) {
        // Return the channel URL for now - in production you'd want specific video embeds
        return `${channelUrl}/featured`;
    }
    return channelUrl;
}

// Show error message
function showError(message) {
    const heroContent = document.getElementById('hero-content');
    const mainContent = document.getElementById('main-content');
    
    heroContent.innerHTML = `
        <h1 class="featured-title">Error</h1>
        <p class="featured-subtitle">${message}</p>
        <div class="featured-actions">
            <a href="../index.html" class="btn btn-primary btn-lg">
                <i data-lucide="arrow-left" class="btn-icon"></i>
                Back to Home
            </a>
        </div>
    `;
    
    mainContent.innerHTML = '';
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
