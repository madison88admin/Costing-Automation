/**
 * Authentication Service
 * Handles user authentication, session management, and security
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check for existing session on initialization
        this.checkExistingSession();
    }

    /**
     * Check if user has an existing valid session
     */
    checkExistingSession() {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const user = localStorage.getItem('user');
        
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
    }

    /**
     * Logout user
     */
    logout() {
        this.clearSession();
        // Redirect to login page
        window.location.href = 'login.html';
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
