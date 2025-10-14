/**
 * Authentication Service
 * Handles user authentication, session management, and security
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.logoutToken = null;
        this.init();
    }

    init() {
        // Initialize logout token from localStorage
        this.logoutToken = localStorage.getItem('logoutToken');
        
        // Register service worker for additional security
        this.registerServiceWorker();
        
        // Add global popstate listener to prevent back button access
        this.setupGlobalBackButtonProtection();
        
        // Check for existing session on initialization
        this.checkExistingSession();
    }
    
    /**
     * Register service worker for authentication security
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Send logout message to service worker when needed
                this.serviceWorkerRegistration = registration;
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
    
    /**
     * Setup global protection against back button navigation
     */
    setupGlobalBackButtonProtection() {
        // Remove any existing popstate listeners to avoid duplicates
        window.removeEventListener('popstate', this.handlePopState);
        
        // Add the popstate listener
        this.handlePopState = (event) => {
            console.log('Back button detected, checking authentication...');
            
            // Always check authentication on any navigation
            if (!this.isUserAuthenticated()) {
                console.log('User not authenticated, redirecting to login...');
                window.location.replace('login.html?popstate_redirect=' + Date.now());
                return;
            }
        };
        
        window.addEventListener('popstate', this.handlePopState);
    }

    /**
     * Check if user has an existing valid session
     */
    checkExistingSession() {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const user = localStorage.getItem('user');
        const storedLogoutToken = localStorage.getItem('logoutToken');
        
        // Check if session was explicitly logged out
        if (storedLogoutToken && this.logoutToken && storedLogoutToken === this.logoutToken) {
            this.clearSession();
            return false;
        }
        
        if (isAuthenticated === 'true' && user) {
            try {
                this.currentUser = JSON.parse(user);
                this.isAuthenticated = true;
                return true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.clearSession();
                return false;
            }
        }
        return false;
    }

    /**
     * Authenticate user with username and password
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise<Object>} Authentication result
     */
    async authenticate(username, password) {
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Demo authentication - replace with actual API call
            const validCredentials = this.validateCredentials(username, password);
            
            if (validCredentials.success) {
                this.currentUser = validCredentials.user;
                this.isAuthenticated = true;
                this.saveSession();
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: validCredentials.message };
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: 'Authentication failed. Please try again.' };
        }
    }

    /**
     * Validate user credentials
     * @param {string} username - Username to validate
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validateCredentials(username, password) {
        // Demo users - replace with actual user database/API
        const users = [
            { username: 'factory', password: 'factory123', role: 'factory', name: 'Factory User', permissions: ['import', 'view_costing'] },
            { username: 'madison', password: 'madison123', role: 'madison', name: 'Madison User', permissions: ['import', 'view_costing', 'view_databank', 'admin'] }
        ];

        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            return {
                success: true,
                user: {
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    permissions: user.permissions,
                    loginTime: new Date().toISOString()
                }
            };
        } else {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }
    }

    /**
     * Save user session to localStorage
     */
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            // Clear any existing logout token on new login
            localStorage.removeItem('logoutToken');
        }
    }

    /**
     * Clear user session
     */
    clearSession() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('loginTime');
        // Note: We intentionally keep logoutToken for security
    }

    /**
     * Logout user
     */
    logout() {
        console.log('🚪 Starting logout process...');
        
        // Generate a unique logout token to prevent back button access
        this.logoutToken = 'logout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('logoutToken', this.logoutToken);
        
        // Notify service worker about logout
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'LOGOUT',
                token: this.logoutToken
            });
        }
        
        this.clearSession();
        
        // Clear browser history and cache
        this.clearBrowserCache();
        
        // Clear all history entries and prevent back navigation
        this.clearBrowserHistory();
        
        console.log('🚪 Logout complete, redirecting to login...');
        
        // Redirect to login page with cache-busting
        window.location.replace('login.html?logout=' + Date.now());
    }
    
    /**
     * Clear browser cache and prevent back button access
     */
    clearBrowserCache() {
        // Clear all cached data
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        
        // Clear session storage
        sessionStorage.clear();
        
        // Clear all localStorage except logout token
        const logoutToken = localStorage.getItem('logoutToken');
        localStorage.clear();
        if (logoutToken) {
            localStorage.setItem('logoutToken', logoutToken);
        }
        
        // Force reload from server (not cache)
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.href);
        }
    }
    
    /**
     * Clear browser history to prevent back button access
     */
    clearBrowserHistory() {
        // Create a new history state that prevents back navigation
        if (window.history && window.history.pushState) {
            // Clear the entire history by pushing multiple states
            for (let i = 0; i < 10; i++) {
                window.history.pushState({logout: true, index: i}, '', window.location.href);
            }
            
            // Replace the current state to ensure we're at the end
            window.history.replaceState({logout: true, final: true}, '', window.location.href);
        }
        
        // Add event listener to prevent back navigation
        const backButtonHandler = (event) => {
            console.log('🚫 Back button blocked, redirecting to login...');
            // If user tries to go back, redirect to login
            window.location.replace('login.html?blocked_back=' + Date.now());
        };
        
        // Remove existing listener and add new one
        window.removeEventListener('popstate', backButtonHandler);
        window.addEventListener('popstate', backButtonHandler);
        
        // Store reference for cleanup
        this.backButtonHandler = backButtonHandler;
    }

    /**
     * Get current user
     * @returns {Object|null} Current user object or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isUserAuthenticated() {
        // Always re-check session validity to prevent back button issues
        if (this.isAuthenticated) {
            // Check for logout token first
            const storedLogoutToken = localStorage.getItem('logoutToken');
            if (storedLogoutToken && this.logoutToken && storedLogoutToken === this.logoutToken) {
                this.clearSession();
                return false;
            }
            
            // Check if session is expired
            if (this.isSessionExpired()) {
                this.logout();
                return false;
            }
        }
        return this.isAuthenticated;
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} Whether user has the role
     */
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    /**
     * Check if user is factory
     * @returns {boolean} Whether user is factory
     */
    isFactory() {
        return this.hasRole('factory');
    }

    /**
     * Check if user is madison
     * @returns {boolean} Whether user is madison
     */
    isMadison() {
        return this.hasRole('madison');
    }

    /**
     * Check if user has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether user has the permission
     */
    hasPermission(permission) {
        return this.currentUser && this.currentUser.permissions && this.currentUser.permissions.includes(permission);
    }

    /**
     * Check if user can view databank
     * @returns {boolean} Whether user can view databank
     */
    canViewDatabank() {
        return this.hasPermission('view_databank');
    }

    /**
     * Check if user can import files
     * @returns {boolean} Whether user can import files
     */
    canImport() {
        return this.hasPermission('import');
    }

    /**
     * Check if user can view costing
     * @returns {boolean} Whether user can view costing
     */
    canViewCosting() {
        return this.hasPermission('view_costing');
    }

    /**
     * Check if user has admin privileges
     * @returns {boolean} Whether user has admin privileges
     */
    isAdmin() {
        return this.hasPermission('admin');
    }

    /**
     * Get session duration
     * @returns {number} Session duration in minutes
     */
    getSessionDuration() {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
            const duration = new Date() - new Date(loginTime);
            return Math.floor(duration / (1000 * 60)); // Convert to minutes
        }
        return 0;
    }

    /**
     * Check if session is expired (24 hours)
     * @returns {boolean} Whether session is expired
     */
    isSessionExpired() {
        const duration = this.getSessionDuration();
        return duration > 1440; // 24 hours in minutes
    }

    /**
     * Refresh session if needed
     */
    refreshSession() {
        if (this.isSessionExpired()) {
            console.log('Session expired, logging out...');
            this.logout();
            return false;
        }
        return true;
    }
}

// Create global instance
window.authService = new AuthService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}
