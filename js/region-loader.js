/**
 * Region content loader for EU, UK, and Swiss AI models
 * Loads and renders model data for each region section from JSON data
 */
'use strict';

let regionsData = null;

// Load regions data from JSON
async function loadRegionsData() {
    if (regionsData) return regionsData;
    
    try {
        const response = await fetch('data/regions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        regionsData = await response.json();
        return regionsData;
    } catch (error) {
        console.error('Error loading regions data:', error);
        return null;
    }
}

// Render model cards
function renderModelCards(models, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const modelsHTML = models.map((model, index) => `
        <div class="content-card model-card-animated" style="animation-delay: ${index * 0.1}s">
            <div class="model-header">
                <div class="model-icon">${model.icon}</div>
                <div class="model-title-section">
                    <h3 class="model-title">${model.title}</h3>
                    <span class="model-org-badge">${model.organization}</span>
                </div>
            </div>
            <div class="model-meta">
                ${model.tags.map(tag => `<span class="model-tag">${tag}</span>`).join('')}
            </div>
            <p class="model-description">${model.description}</p>
            <div class="model-footer">
                <span class="model-country">📍 ${model.country}</span>
                <a href="${model.link}" class="card-link model-link-enhanced" target="_blank" rel="noopener noreferrer">
                    <span>View Repository</span>
                    <i class="link-arrow">→</i>
                </a>
            </div>
        </div>
    `).join('');

    container.innerHTML = modelsHTML;
}

// Load region content
async function loadRegionContent(regionName) {
    const contentId = `${regionName}-content`;
    const data = await loadRegionsData();
    
    if (!data) {
        console.error('Failed to load regions data');
        return;
    }
    
    const regionKey = regionName.replace('-region', '');
    const regionData = data.regions[regionKey];
    
    if (regionData && regionData.models) {
        renderModelCards(regionData.models, contentId);
    } else {
        console.warn('Unknown region:', regionName);
    }
}

// Export for use in main.js
window.loadRegionContent = loadRegionContent;
