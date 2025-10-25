/*
 * FILE: public/js/api.js
 * This file defines the global 'api' object.
 * It centralizes all calls to your backend.
 */

const API_BASE_URL = '/api'; // We use relative paths because we're on the same port

/**
 * A helper function to handle fetch responses and errors.
 * @param {Response} response - The raw fetch response.
 * @returns {Promise<any>} - The JSON data from the response.
 */
const handleResponse = async (response) => {
    // If the response is not ok (e.g., 401, 404, 500), get the error message
    if (!response.ok) {
        // The 401 response from our auth middleware might not be JSON
        if (response.status === 401) {
           const text = await response.text();
           // Use a default message if the text is empty
           throw new Error(text || 'Not authorized, no token');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
    }
    // For 204 No Content (like logout), there's no JSON to parse
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

/**
 * A helper function to handle fetch errors (e.g., network down).
 * @param {Error} error - The error object.
 */
const handleError = (error) => {
    console.error('API Call Failed:', error.message || error);
    const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
    return { error: errorMessage };
};


// Define the global 'api' object
const api = {
    /**
     * Attempts to sign up a new user.
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user: object}|{error: string}>}
     */
    signup: async (username, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await handleResponse(response);
            return { user: data };
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Attempts to log in a user.
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user: object}|{error: string}>}
     */
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await handleResponse(response);
            return { user: data };
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Logs out the current user.
     */
    logout: async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
            return {}; // Success
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Checks if the user has a valid session.
     * @returns {Promise<{user: object}|{error: string}>}
     */
    checkAuth: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check`);
            const data = await handleResponse(response);
            return { user: data };
        } catch (error) {
            return handleError(error);
        }
    },
    
    /**
     * Makes a donation. (Requires auth)
     * @param {number} amount 
     * @returns {Promise<{donation: object}|{error: string}>}
     */
    makeDonation: async (amount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/donations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });
            const data = await handleResponse(response);
            return { donation: data };
        } catch (error) {
            // Special handling for auth errors
            if (error.message.includes('401') || error.message.includes('Not authorized')) {
                return { error: 'You must be logged in to donate.' };
            }
            return handleError(error);
        }
    },

    /**
     * Gets the user's game data. (Requires auth)
     * @returns {Promise<{gameData: object}|{error: string}>}
     */
    getGameData: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/game`);
            const data = await handleResponse(response);
            return { gameData: data };
        } catch (error) {
            return handleError(error);
        }
    },

    /**
     * Updates the user's game data. (Requires auth)
     * @param {number} highScore 
     * @returns {Promise<{gameData: object}|{error: string}>}
     */
    saveGameScore: async (highScore) => {
        try {
            const response = await fetch(`${API_BASE_URL}/game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ highScore }),
            });
            const data = await handleResponse(response);
            return { gameData: data };
        } catch (error) {
            return handleError(error);
        }
    },

    // --- *** NEW FUNCTION ADDED HERE *** ---
    /**
     * Gets the top 10 leaderboard.
     * @returns {Promise<{gameData: Array}|{error: string}>}
     */
    getLeaderboard: async () => {
        try {
            // Assuming your endpoint is /api/game/leaderboard
            const response = await fetch(`${API_BASE_URL}/game/leaderboard`);
            const data = await handleResponse(response);
            return { gameData: data }; // Returns an array
        } catch (error) {
            return handleError(error);
        }
    }
};

// ===================================================================
// --- !!! YOUR EXISTING BRIDGE FUNCTION (NO CHANGES) !!! ---
// ===================================================================

/**
 * GLOBAL BRIDGE FUNCTION
 * This function MUST be on the 'window' object (by being declared globally)
 * to be visible to Unity's C# code.
 */
window.SendScoreToFrontend = (score) => {
    console.log(`[Bridge] Received final score from Unity: ${score}`);
    
    // Now, call your existing 'saveGameScore' function from the 'api' object
    api.saveGameScore(score)
        .then(response => {
            
            // Check if the response object has gameData (success)
            if (response.gameData) {
                console.log('[Bridge] Score saved successfully!', response.gameData);
                
                // Optionally update the high score on the page in real-time
                const highScoreSpan = document.getElementById('high-score');
                if (highScoreSpan) {
                    // Use the new high score from the server's response
                    highScoreSpan.textContent = response.gameData.highScore; 
                }
                
                // --- NEW ---
                // After saving, refresh the leaderboard to show the new score
                router.loadLeaderboardData(); // Assuming router.js is accessible
                
            } else {
                // Handle the case where saveGameScore returned an error object
                console.error('[Bridge] Failed to save score:', response.error);
            }
        })
        .catch(err => {
            // Handle critical errors (e.g., fetch failed)
            console.error('[Bridge] Critical error calling saveGameScore:', err);
        });
};

