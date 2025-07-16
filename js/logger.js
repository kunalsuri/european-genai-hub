/**
 * Production-Ready Logger
 * Handles development vs production logging
 */
'use strict';

class Logger {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.protocol === 'file:';
        this.isProduction = !this.isDevelopment;
    }

    log(message, ...args) {
        if (this.isDevelopment) {
            console.log(message, ...args);
        }
    }

    warn(message, ...args) {
        if (this.isDevelopment) {
            console.warn(message, ...args);
        } else {
            // In production, still log warnings but silently
            this.silent('WARN', message, ...args);
        }
    }

    error(message, ...args) {
        // Always log errors, even in production
        console.error(message, ...args);
        this.silent('ERROR', message, ...args);
    }

    silent(level, message, ...args) {
        // Could be extended to send to external logging service
        // For now, just store in memory for debugging
        if (!window.appLogs) {
            window.appLogs = [];
        }
        window.appLogs.push({
            level,
            message,
            args,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 logs
        if (window.appLogs.length > 100) {
            window.appLogs.shift();
        }
    }
}

// Global logger instance
window.logger = new Logger();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}