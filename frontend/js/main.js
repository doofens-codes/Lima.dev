// This is the main entry point for the frontend JavaScript.

// We wrap everything in a DOMContentLoaded listener to ensure
// the HTML document is fully loaded before we try to interact with it.
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize the auth system first.
    // This will check if the user is already logged in (via cookies)
    // and update the navbar accordingly.
    auth.init().then(() => {
        
        // 2. After auth is confirmed, initialize the router.
        // The router will then load the correct page component
        // based on the URL hash and the user's auth state.
        router.init();
        
    }).catch(error => {
        console.error("Failed to initialize app:", error);
    });
    
});
