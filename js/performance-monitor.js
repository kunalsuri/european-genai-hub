/**
 * Performance Monitoring and Optimization
 * EU GenAI Hub - Security and Performance Enhancements
 */
'use strict';

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: 0,
            searchPerformance: new Map(),
            memoryUsage: [],
            errors: []
        };
        
        this.init();
    }
    
    init() {
        this.trackPageLoad();
        this.monitorMemoryUsage();
        this.trackErrors();
        this.optimizeImages();
        this.preloadCriticalResources();
    }
    
    trackPageLoad() {
        if (typeof performance !== 'undefined' && performance.timing) {
            window.addEventListener('load', () => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                this.metrics.pageLoad = loadTime;
                
                if (loadTime > 3000) {
                    window.logger.warn(`Slow page load detected: ${loadTime}ms`);
                }
                
                // Log performance metrics
                window.logger.log('Performance Metrics:', {
                    pageLoad: `${loadTime}ms`,
                    domContentLoaded: `${performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart}ms`,
                    firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 'N/A'
                });
            });
        }
    }
    
    monitorMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            setInterval(() => {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.metrics.memoryUsage.push(memInfo);
                
                // Keep only last 20 measurements
                if (this.metrics.memoryUsage.length > 20) {
                    this.metrics.memoryUsage.shift();
                }
                
                // Check for memory leaks
                if (memInfo.used > memInfo.limit * 0.8) {
                    window.logger.warn('High memory usage detected:', memInfo);
                }
            }, 30000); // Check every 30 seconds
        }
    }
    
    trackErrors() {
        window.addEventListener('error', (e) => {
            const errorInfo = {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                timestamp: Date.now()
            };
            
            this.metrics.errors.push(errorInfo);
            
            // Keep only last 10 errors
            if (this.metrics.errors.length > 10) {
                this.metrics.errors.shift();
            }
            
            window.logger.error('Application error tracked:', errorInfo);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            const errorInfo = {
                message: e.reason.message || 'Unhandled Promise Rejection',
                type: 'promise',
                timestamp: Date.now()
            };
            
            this.metrics.errors.push(errorInfo);
            window.logger.error('Unhandled promise rejection:', errorInfo);
        });
    }
    
    trackSearchPerformance(searchType, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (!this.metrics.searchPerformance.has(searchType)) {
            this.metrics.searchPerformance.set(searchType, []);
        }
        
        const searches = this.metrics.searchPerformance.get(searchType);
        searches.push(duration);
        
        // Keep only last 50 searches
        if (searches.length > 50) {
            searches.shift();
        }
        
        if (duration > 1000) {
            window.logger.warn(`Slow search detected for ${searchType}: ${duration}ms`);
        }
    }
    
    optimizeImages() {
        // Lazy load images that are not immediately visible
        const images = document.querySelectorAll('img');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            images.forEach(img => {
                if (img.getBoundingClientRect().top > window.innerHeight) {
                    img.dataset.src = img.src;
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4K';
                    imageObserver.observe(img);
                }
            });
        }
    }
    
    preloadCriticalResources() {
        // Preload critical CSS and fonts
        const criticalResources = [
            'css/style.css',
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.includes('.css') ? 'style' : 'font';
            if (link.as === 'font') {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now()
        };
    }
    
    // CSP Violation Reporter
    reportCSPViolation(violation) {
        window.logger.error('CSP Violation:', violation);
        this.metrics.errors.push({
            type: 'csp-violation',
            message: violation.violatedDirective,
            timestamp: Date.now()
        });
    }
    
    // Security Event Monitor
    monitorSecurityEvents() {
        // Monitor for potential click-jacking attempts
        if (window.self !== window.top) {
            window.logger.warn('Application loaded in iframe - potential click-jacking attempt');
        }
        
        // Monitor for suspicious URL changes
        let lastURL = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastURL) {
                if (window.location.href.includes('<script>') || window.location.href.includes('javascript:')) {
                    window.logger.error('Suspicious URL change detected');
                    window.location.href = lastURL;
                }
                lastURL = window.location.href;
            }
        }, 1000);
    }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Export for global access
window.performanceMonitor = performanceMonitor;

// CSP violation handler
document.addEventListener('securitypolicyviolation', (e) => {
    performanceMonitor.reportCSPViolation(e);
});

// Start security monitoring
performanceMonitor.monitorSecurityEvents();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}