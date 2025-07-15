// Interactive map functionality for European GenAI research institutions
class ResearchMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.markersLayer = null;
        this.institutions = [];
        this.isInitialized = false;
    }

    init(institutions = []) {
        this.institutions = institutions;
        
        if (!this.isInitialized) {
            this.setupMap();
            this.setupFilters();
            this.isInitialized = true;
        }
        
        this.loadMarkers();
    }

    setupMap() {
        const mapElement = document.getElementById('research-map');
        if (!mapElement) {
            console.error('Map container not found');
            return;
        }

        try {
            // Initialize Leaflet map centered on Europe
            this.map = L.map('research-map', {
                center: [54.5260, 15.2551], // Central Europe
                zoom: 4,
                minZoom: 3,
                maxZoom: 18,
                zoomControl: true,
                attributionControl: true
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Create markers layer group
            this.markersLayer = L.layerGroup().addTo(this.map);

            console.log('Research map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapError();
        }
    }

    loadMarkers() {
        if (!this.map || !this.markersLayer) {
            console.error('Map not properly initialized');
            return;
        }

        // Clear existing markers
        this.markersLayer.clearLayers();
        this.markers = [];

        if (this.institutions.length === 0) {
            this.showEmptyMapState();
            return;
        }

        // Add markers for each institution
        this.institutions.forEach((institution, index) => {
            this.addInstitutionMarker(institution, index);
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    addInstitutionMarker(institution, index) {
        // Get coordinates for the institution
        const coords = this.getInstitutionCoordinates(institution);
        if (!coords) {
            console.warn(`No coordinates found for ${institution.name}`);
            return;
        }

        try {
            // Create custom marker
            const marker = L.marker([coords.lat, coords.lng], {
                icon: this.createCustomIcon(institution.type)
            });

            // Create popup content
            const popupContent = this.createPopupContent(institution);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            });

            // Add marker to layer and store reference
            marker.addTo(this.markersLayer);
            this.markers.push(marker);

            // Store institution data with marker
            marker.institutionData = institution;

        } catch (error) {
            console.error(`Error creating marker for ${institution.name}:`, error);
        }
    }

    getInstitutionCoordinates(institution) {
        // European country capitals and major cities coordinates
        const coordinates = {
            // Countries
            'Germany': { lat: 52.5200, lng: 13.4050 },
            'France': { lat: 48.8566, lng: 2.3522 },
            'Italy': { lat: 41.9028, lng: 12.4964 },
            'Spain': { lat: 40.4168, lng: -3.7038 },
            'Netherlands': { lat: 52.3676, lng: 4.9041 },
            'Belgium': { lat: 50.8503, lng: 4.3517 },
            'Austria': { lat: 48.2082, lng: 16.3738 },
            'Switzerland': { lat: 46.9480, lng: 7.4474 },
            'Sweden': { lat: 59.3293, lng: 18.0686 },
            'Norway': { lat: 59.9139, lng: 10.7522 },
            'Denmark': { lat: 55.6761, lng: 12.5683 },
            'Finland': { lat: 60.1699, lng: 24.9384 },
            'Poland': { lat: 52.2297, lng: 21.0122 },
            'Czech Republic': { lat: 50.0755, lng: 14.4378 },
            'Hungary': { lat: 47.4979, lng: 19.0402 },
            'Portugal': { lat: 38.7223, lng: -9.1393 },
            'Greece': { lat: 37.9838, lng: 23.7275 },
            'Ireland': { lat: 53.3498, lng: -6.2603 },
            'Luxembourg': { lat: 49.6116, lng: 6.1319 },
            'Slovenia': { lat: 46.0569, lng: 14.5058 },
            'Slovakia': { lat: 48.1486, lng: 17.1077 },
            'Croatia': { lat: 45.8150, lng: 15.9819 },
            'Estonia': { lat: 59.4370, lng: 24.7536 },
            'Latvia': { lat: 56.9496, lng: 24.1052 },
            'Lithuania': { lat: 54.6872, lng: 25.2797 },
            'Romania': { lat: 44.4268, lng: 26.1025 },
            'Bulgaria': { lat: 42.6977, lng: 23.3219 },
            'Cyprus': { lat: 35.1264, lng: 33.4299 },
            'Malta': { lat: 35.8997, lng: 14.5146 },
            
            // Major cities for better precision
            'Berlin': { lat: 52.5200, lng: 13.4050 },
            'Munich': { lat: 48.1351, lng: 11.5820 },
            'Hamburg': { lat: 53.5511, lng: 9.9937 },
            'Paris': { lat: 48.8566, lng: 2.3522 },
            'Lyon': { lat: 45.7640, lng: 4.8357 },
            'Marseille': { lat: 43.2965, lng: 5.3698 },
            'Rome': { lat: 41.9028, lng: 12.4964 },
            'Milan': { lat: 45.4642, lng: 9.1900 },
            'Turin': { lat: 45.0703, lng: 7.6869 },
            'Madrid': { lat: 40.4168, lng: -3.7038 },
            'Barcelona': { lat: 41.3851, lng: 2.1734 },
            'Amsterdam': { lat: 52.3676, lng: 4.9041 },
            'Rotterdam': { lat: 51.9244, lng: 4.4777 },
            'Brussels': { lat: 50.8503, lng: 4.3517 },
            'Vienna': { lat: 48.2082, lng: 16.3738 },
            'Zurich': { lat: 47.3769, lng: 8.5417 },
            'Geneva': { lat: 46.2044, lng: 6.1432 },
            'Stockholm': { lat: 59.3293, lng: 18.0686 },
            'Oslo': { lat: 59.9139, lng: 10.7522 },
            'Copenhagen': { lat: 55.6761, lng: 12.5683 },
            'Helsinki': { lat: 60.1699, lng: 24.9384 },
            'Warsaw': { lat: 52.2297, lng: 21.0122 },
            'Prague': { lat: 50.0755, lng: 14.4378 },
            'Budapest': { lat: 47.4979, lng: 19.0402 },
            'Lisbon': { lat: 38.7223, lng: -9.1393 },
            'Athens': { lat: 37.9838, lng: 23.7275 },
            'Dublin': { lat: 53.3498, lng: -6.2603 }
        };

        // Try to find coordinates by city first, then country
        if (institution.city && coordinates[institution.city]) {
            return coordinates[institution.city];
        }
        
        if (institution.country && coordinates[institution.country]) {
            // Add some random offset to avoid overlapping markers
            const baseCoords = coordinates[institution.country];
            const offset = 0.5; // Degrees
            return {
                lat: baseCoords.lat + (Math.random() - 0.5) * offset,
                lng: baseCoords.lng + (Math.random() - 0.5) * offset
            };
        }

        return null;
    }

    createCustomIcon(type) {
        const iconColors = {
            'university': '#003399',
            'research': '#E74C3C',
            'industry': '#FFCC00',
            'default': '#2C3E50'
        };

        const color = iconColors[type] || iconColors.default;

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
            ">${this.getTypeIcon(type)}</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
    }

    getTypeIcon(type) {
        const icons = {
            'university': 'U',
            'research': 'R',
            'industry': 'I',
            'default': '?'
        };
        return icons[type] || icons.default;
    }

    createPopupContent(institution) {
        return `
            <div class="map-popup">
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">
                    ${this.escapeHtml(institution.name)}
                </h3>
                <div style="margin-bottom: 0.5rem;">
                    <strong>Country:</strong> ${this.escapeHtml(institution.country)}<br>
                    <strong>Type:</strong> ${this.escapeHtml(institution.type)}<br>
                    <strong>Focus:</strong> ${this.escapeHtml(institution.focus)}
                </div>
                <p style="margin-bottom: 0.5rem; font-size: 0.9rem;">
                    ${this.escapeHtml(institution.description)}
                </p>
                ${institution.research_areas && institution.research_areas.length > 0 ? `
                    <div style="margin-bottom: 0.5rem;">
                        <strong>Research Areas:</strong><br>
                        ${institution.research_areas.map(area => 
                            `<span style="
                                background: var(--neutral-color);
                                padding: 0.2rem 0.4rem;
                                border-radius: 4px;
                                font-size: 0.8rem;
                                margin-right: 0.3rem;
                                display: inline-block;
                                margin-bottom: 0.2rem;
                            ">${this.escapeHtml(area)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                ${institution.website ? `
                    <div style="margin-top: 0.5rem;">
                        <a href="${this.escapeHtml(institution.website)}" 
                           target="_blank" 
                           style="
                                background: var(--primary-color);
                                color: white;
                                padding: 0.3rem 0.6rem;
                                text-decoration: none;
                                border-radius: 4px;
                                font-size: 0.8rem;
                           ">
                            Visit Website
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupFilters() {
        // Type filter
        const typeFilter = document.getElementById('map-filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Country filter
        const countryFilter = document.getElementById('map-filter-country');
        if (countryFilter) {
            countryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
            
            // Populate country options
            this.populateCountryFilter();
        }
    }

    populateCountryFilter() {
        const countryFilter = document.getElementById('map-filter-country');
        if (!countryFilter || !this.institutions) return;

        const countries = [...new Set(this.institutions.map(inst => inst.country))].sort();
        
        // Clear existing options except the first one
        while (countryFilter.children.length > 1) {
            countryFilter.removeChild(countryFilter.lastChild);
        }

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }

    applyFilters() {
        const typeFilter = document.getElementById('map-filter-type');
        const countryFilter = document.getElementById('map-filter-country');

        const selectedType = typeFilter ? typeFilter.value : 'all';
        const selectedCountry = countryFilter ? countryFilter.value : 'all';

        // Filter institutions
        const filteredInstitutions = this.institutions.filter(institution => {
            const typeMatch = selectedType === 'all' || institution.type === selectedType;
            const countryMatch = selectedCountry === 'all' || institution.country === selectedCountry;
            return typeMatch && countryMatch;
        });

        // Clear current markers
        this.markersLayer.clearLayers();
        this.markers = [];

        // Add filtered markers
        filteredInstitutions.forEach((institution, index) => {
            this.addInstitutionMarker(institution, index);
        });

        // Fit map to filtered markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        } else {
            this.showEmptyMapState();
        }
    }

    showEmptyMapState() {
        if (!this.map) return;

        // Add a message overlay to the map
        const mapContainer = document.getElementById('research-map');
        if (mapContainer) {
            const overlay = document.createElement('div');
            overlay.className = 'map-empty-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.9);
                padding: 2rem;
                border-radius: var(--border-radius);
                text-align: center;
                z-index: 1000;
                box-shadow: var(--shadow-medium);
            `;
            overlay.innerHTML = `
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">
                    No Institutions Found
                </h3>
                <p style="margin: 0; color: var(--text-color);">
                    No research institutions match your current filters.
                </p>
            `;

            // Remove existing overlay
            const existing = mapContainer.querySelector('.map-empty-overlay');
            if (existing) existing.remove();

            mapContainer.appendChild(overlay);

            // Remove overlay after 3 seconds
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 3000);
        }
    }

    showMapError() {
        const mapContainer = document.getElementById('research-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: var(--neutral-color);
                    border-radius: var(--border-radius);
                    text-align: center;
                    padding: 2rem;
                ">
                    <div>
                        <h3 style="color: var(--primary-color); margin-bottom: 1rem;">
                            Map Loading Error
                        </h3>
                        <p style="color: var(--text-color); margin-bottom: 1rem;">
                            Unable to load the interactive map. Please check your internet connection and try refreshing the page.
                        </p>
                        <button onclick="location.reload()" style="
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: var(--border-radius);
                            cursor: pointer;
                        ">
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
    }

    resizeMap() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.ResearchMap = new ResearchMap();
