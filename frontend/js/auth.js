/*
 * FILE: public/js/auth.js
 * This file defines the global 'auth' object.
 * It depends on 'api.js' and 'ui.js'.
 * It MUST be loaded *after* 'api.js' and 'ui.js'.
 */

// Define the global 'auth' object
const auth = {
    currentUser: null,

    init: async () => {
        const { user, error } = await api.checkAuth();
        if (user) {
            auth.currentUser = user;
        } else {
            auth.currentUser = null;
            if (error) {
                if (!error.includes('no token') && !error.includes('Not authorized')) {
                    console.log("Auth check error:", error);
                }
            }
        }
        ui.updateNavbar(auth.currentUser);

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', auth.handleLogout);
        }
    },

    /**
     * Handles the signup form submission. (UPDATED)
     */
    handleSignup: async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const username = form.username.value;
        const email = form.email.value;
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        // --- Password Match Check ---
        if (password !== confirmPassword) {
            // UPDATED: Calls the new toast function
            ui.displayError('Passwords do not match.');
            return;
        }

        const { user, error } = await api.signup(username, email, password);

        if (error) {
            // UPDATED: Calls the new toast function
            ui.displayError(error);
        } else {
            auth.currentUser = user;
            ui.updateNavbar(auth.currentUser);
            // UPDATED: Show a success toast!
            ui.displaySuccess(`Welcome, ${user.username}!`);
            window.location.hash = '#home'; // Redirect to home
        }
    },

    /**
     * Handles the login form submission. (UPDATED)
     */
    handleLogin: async (e) => {
        e.preventDefault();

        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        const { user, error } = await api.login(email, password);

        if (error) {
            // UPDATED: Calls the new toast function
            ui.displayError(error);
        } else {
            auth.currentUser = user;
            ui.updateNavbar(auth.currentUser);
            // UPDATED: Show a success toast!
            ui.displaySuccess(`Welcome back, ${user.username}!`);
            window.location.hash = '#home'; // Redirect to home
        }
    },

    /**
     * Handles the logout button click. (UPDATED)
     */
    handleLogout: async (e) => {
        e.preventDefault();
        await api.logout();
        auth.currentUser = null;
        ui.updateNavbar(null);
        // UPDATED: Show a success toast!
        ui.displaySuccess('You have been logged out.');
        window.location.hash = '#home'; // Redirect to home
    },
    
    isAuthenticated: () => {
        return !!auth.currentUser;
    }
};