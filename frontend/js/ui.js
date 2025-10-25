/*
 * FILE: public/js/ui.js
 * This file defines the global 'ui' object.
 * It handles all direct DOM manipulation, like updating the navbar
 * and creating new toast notifications.
 * It has NO dependencies.
 */

// Define the global 'ui' object
const ui = {
    /**
     * Updates the navbar based on the user's login state.
     * @param {object | null} user - The user object, or null if logged out.
     */
    updateNavbar: (user) => {
        const guestLinks = document.querySelectorAll('.auth-guest');
        const userLinks = document.querySelectorAll('.auth-required');
        const userInfo = document.querySelectorAll('.auth-user');

        if (user) {
            // User is logged in
            guestLinks.forEach(link => link.style.display = 'none');
            userLinks.forEach(link => link.style.display = 'block');
            userInfo.forEach(link => link.style.display = 'flex');
            
            document.getElementById('nav-username').textContent = `Hi, ${user.username}`;
        } else {
            // User is logged out
            guestLinks.forEach(link => link.style.display = 'block');
            userLinks.forEach(link => link.style.display = 'none');
            userInfo.forEach(link => link.style.display = 'none');
            
            document.getElementById('nav-username').textContent = '';
        }
    },

    /**
     * --- (REWRITTEN FOR TOASTS - v2) ---
     * Creates and displays a new toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error'
     */
    showToast: (message, type) => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        // 1. Create the new toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`; // e.g., "toast success"
        toast.textContent = message;

        // 2. Add it to the container
        toastContainer.appendChild(toast);

        // --- UPDATED: Robust Timer Logic ---

        // 3. Wait 2.7 seconds (2700ms) while the toast is visible
        setTimeout(() => {
            // 4. Add the 'is-hiding' class to trigger the CSS fade-out animation
            toast.classList.add('is-hiding');

            // 5. Wait 0.3 seconds (300ms) *for the fade-out animation to finish*
            setTimeout(() => {
                // 6. Now that it's invisible, remove it from the DOM
                toast.remove();
            }, 300); // This (300ms) must match the .is-hiding animation duration
        }, 2700); // This is the time the toast stays on screen
    },

    /**
     * Displays an error message in a toast.
     */
    displayError: (message) => {
        ui.showToast(message, 'error');
    },

    /**
     * Displays a success message in a toast.
     */
    displaySuccess: (message) => {
        ui.showToast(message, 'success');
    },

    /**
     * (This function is no longer used by our app, 
     * but can be left here.)
     */
    hideError: (elementId) => {
        const errorBox = document.getElementById(elementId);
        if (errorBox) {
            errorBox.style.display = 'none';
        }
    }
};

