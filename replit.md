# European Gen AI Hub - Replit Development Guide

## Overview

European Gen AI Hub is a static web application that serves as a comprehensive directory and resource hub for Generative AI research and innovation across the European Union and Switzerland. The application provides an interactive platform for exploring AI institutions, research projects, models, and resources throughout Europe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application follows a **Single Page Application (SPA)** pattern with vanilla JavaScript, HTML, and CSS. The architecture emphasizes:

- **Client-side routing** using hash-based navigation
- **Modular JavaScript classes** for different functionalities
- **Progressive loading** with lazy-loaded content sections
- **Responsive design** optimized for both desktop and mobile devices

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+
- **Styling**: Custom CSS with CSS variables for theming
- **Icons**: Lucide icons library
- **Charts**: Chart.js for data visualization
- **Data Storage**: Static JSON files for content management
- **Deployment**: Static hosting (designed for HuggingFace Spaces)

## Key Components

### 1. Core Application (`js/main.js`)
- **EUGenAIHub class**: Main application controller
- **Navigation management**: Hash-based routing between sections
- **Data loading**: Asynchronous loading of JSON data files
- **Error handling**: Graceful degradation and error recovery

### 2. Search System (`js/page-specific-search.js`)
- **Page-specific search managers**: Customized search for each content type
- **Debounced search**: Performance-optimized search with caching
- **Filter system**: Advanced filtering capabilities for different data types

### 3. Performance Monitoring (`js/performance-monitor.js`)
- **Real-time metrics**: Page load time and memory usage tracking
- **Image optimization**: Lazy loading with Intersection Observer
- **Resource preloading**: Critical resource optimization

### 4. Logging System (`js/logger.js`)
- **Environment-aware logging**: Different logging strategies for development vs production
- **Error aggregation**: Centralized error tracking and reporting

### 5. Data Management
- **Static JSON files** in `/data/` directory:
  - `institutions.json`: Research institutions and organizations
  - `projects.json`: Active and completed research projects
  - `models.json`: LLM/VLM models developed in Europe
  - `resources.json`: Papers, datasets, and tools
  - `featured-initiatives.json`: Highlighted AI initiatives
  - `research-areas.json`: Learning resources and research areas

## Data Flow

### 1. Application Initialization
```
User visits site → Security validation → Load home data → Initialize components → Background data loading
```

### 2. Navigation Flow
```
User clicks navigation → Hash change → Load section data → Update UI → Initialize search
```

### 3. Search Flow
```
User types query → Debounce → Cache check → Filter data → Render results → Track performance
```

### 4. Content Loading
```
Section requested → Check if loaded → Fetch JSON → Parse data → Cache results → Render UI
```

## External Dependencies

### CDN Dependencies
- **Chart.js** (v4.4.0): Data visualization and statistics charts
- **Lucide Icons**: Modern icon library for UI elements
- **Google Fonts**: Inter and Space Grotesk fonts

### Performance Considerations
- All external resources use **integrity hashes** for security
- **Preconnect directives** for CDN optimization
- **Lazy loading** for non-critical resources

## Deployment Strategy

### Security Headers
The application implements comprehensive security measures:
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection
- **Referrer Policy**: Privacy protection

### Input Sanitization
- **XSS Prevention**: All user inputs are sanitized
- **URL Validation**: Prevents injection attacks
- **CSRF Protection**: Same-origin policy enforcement

### Performance Optimizations
- **Critical resource preloading**: CSS and fonts
- **Image lazy loading**: Reduces initial page load
- **Search result caching**: Improves search performance
- **Memory leak prevention**: Proper event listener cleanup

### Static Hosting Optimization
- **Single HTML file**: All routing handled client-side
- **Gzip-friendly**: Optimized for static file compression
- **CDN-ready**: External resources from reliable CDNs
- **Mobile-optimized**: Responsive design for all devices

### Error Handling
- **Graceful degradation**: Application works even if some data fails to load
- **Emergency mode**: Basic functionality available during failures
- **User feedback**: Clear error messages and recovery options

### SEO and Accessibility
- **Semantic HTML**: Proper heading hierarchy and structure
- **Meta tags**: Comprehensive metadata for search engines
- **robots.txt**: Search engine crawling guidelines
- **Responsive design**: Mobile-friendly layout

The architecture prioritizes security, performance, and maintainability while providing a rich user experience for exploring European AI research landscape.