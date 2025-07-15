# EU GenAI Hub - European Generative AI Research Portal

## Overview

EU GenAI Hub is a comprehensive web portal designed to showcase and explore Generative AI research across Europe. The application serves as a centralized platform for discovering European institutions, research projects, resources, and news related to GenAI development. It features an interactive map visualization, search functionality, and categorized content sections to help users navigate the European GenAI research landscape.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

This is a client-side web application built with vanilla HTML, CSS, and JavaScript. The architecture follows a modular approach with separate JavaScript classes handling different functionalities:

- **Frontend-only architecture**: No backend server required, all data is loaded from static JSON files
- **Modular JavaScript**: Object-oriented approach with dedicated classes for different features
- **Static file serving**: Application can be served from any static web server
- **External CDN dependencies**: Uses CDN-hosted libraries for maps and charts

## Key Components

### 1. Core Application (main.js)
- **EUGenAIHub class**: Main application controller
- **Data loading**: Fetches JSON data files for institutions, projects, resources, and news
- **Navigation management**: Handles section switching and active state management
- **Statistics initialization**: Sets up dashboard metrics and visualizations

### 2. Interactive Map (map.js)
- **ResearchMap class**: Manages the European research institution map
- **Leaflet integration**: Uses Leaflet.js for interactive mapping functionality
- **Marker management**: Displays and filters research institutions geographically
- **Filter system**: Allows users to filter institutions by various criteria

### 3. Search System (search.js)
- **SearchManager class**: Handles search and filtering across all content sections
- **Debounced search**: Implements delayed search to improve performance
- **Multi-section filtering**: Provides search capabilities for institutions, projects, resources, and news
- **Enhanced input controls**: Adds visual enhancements to search inputs

### 4. Content Sections
- **Multi-page structure**: Separate HTML pages for each major section
- **Consistent navigation**: Unified navigation bar across all pages
- **Search integration**: Each section includes dedicated search and filter controls

### 5. Styling System
- **CSS custom properties**: Centralized theming using CSS variables
- **European color scheme**: Blue and yellow color palette reflecting EU branding
- **Responsive design**: Mobile-first approach with flexible layouts
- **Component-based styles**: Modular CSS organization

## Data Flow

1. **Application Initialization**: EUGenAIHub class loads all JSON data files on startup
2. **Data Distribution**: Loaded data is passed to specialized components (map, search, etc.)
3. **User Interaction**: Navigation clicks trigger section switching and component initialization
4. **Search Processing**: Search inputs trigger filtered content display with debounced execution
5. **Map Updates**: Geographic data updates markers and filters on the interactive map

## External Dependencies

### JavaScript Libraries
- **Leaflet.js (v1.9.4)**: Interactive mapping functionality
- **Chart.js**: Data visualization and statistics charts

### Fonts
- **Google Fonts**: Inter and Source Sans Pro font families

### Map Data
- **OpenStreetMap**: Tile layer provider for the interactive map
- **Static JSON files**: All application data stored in local JSON files

### Development Dependencies
- No build system or package manager required
- Pure vanilla JavaScript implementation
- Static file serving capability needed

## Deployment Strategy

### Static Hosting Requirements
- **Web server**: Any static file server (Apache, Nginx, GitHub Pages, Netlify, etc.)
- **HTTPS recommended**: For loading external resources securely
- **CORS considerations**: May need CORS headers for local JSON file loading in some environments

### File Structure
- **Root level**: Main index.html and core assets
- **Pages directory**: Individual section pages
- **CSS directory**: Centralized styling
- **JS directory**: Modular JavaScript components
- **Data directory**: JSON data files for content

### Content Management
- **JSON-based content**: All dynamic content stored in easily editable JSON files
- **No database required**: Content updates through direct file modification
- **Version control friendly**: All content changes trackable through Git

The application is designed to be easily deployable to any static hosting platform while maintaining full functionality through client-side JavaScript and external CDN resources.