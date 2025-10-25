/*
 * FILE: public/js/router.js
 * This file defines the global 'router' object.
 */

// This assumes 'auth', 'ui', and 'api' objects are defined in other scripts
// loaded *before* this one in your main index.html

const router = {
    routes: {},
    appContainer: null,
    currentUnityInstance: null, 

    init: () => {
        router.appContainer = document.getElementById('app-container');
        if (!router.appContainer) {
            console.error('Fatal Error: #app-container not found.');
            return;
        }
        router.routes = {
            '#home':   { path: '/components/home.html',   requiresAuth: false },
            '#login':  { path: '/components/login.html',  requiresAuth: false, isGuestOnly: true },
            '#signup': { path: '/components/signup.html', requiresAuth: false, isGuestOnly: true },
            '#donate': { path: '/components/donate.html', requiresAuth: true },
            '#game':   { path: '/components/game.html',   requiresAuth: true },
        };
        window.addEventListener('hashchange', router.handleRouteChange);
        router.handleRouteChange();
    },

    handleRouteChange: () => {
        const hash = window.location.hash || '#home';
        const cleanHash = '#' + hash.split('#')[1] || '#home';
        const route = router.routes[cleanHash];

        router.updateActiveNav(cleanHash);

        if (!route) {
            router.cleanupGameInstance(); // Clean up if navigating to invalid route
            router.appContainer.innerHTML = `<section class="page-container"><h2>404 - Page Not Found</h2></section>`;
            return;
        }
        
        const isLoggedIn = auth.isAuthenticated();
        
        if (route.requiresAuth && !isLoggedIn) {
            router.cleanupGameInstance(); // Clean up if navigating away due to auth
            ui.displayError('You must be logged in to see that page.');
            window.location.hash = '#login';
            return;
        }

        if (route.isGuestOnly && isLoggedIn) {
             router.cleanupGameInstance(); // Clean up if navigating away due to auth
            window.location.hash = '#home';
            return;
        }
        router.loadComponent(route.path, cleanHash);
    },

    updateActiveNav: (currentRoute) => {
        const navLinks = document.querySelectorAll('#navbar [data-route]');
        navLinks.forEach(link => {
            const linkRoute = link.getAttribute('data-route');
            if (linkRoute === currentRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        // Special case for home link if no hash
        if (currentRoute === '#home') {
            const homeLink = document.querySelector('.nav-link[data-route="#home"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    },

    loadComponent: async (path, hash) => {
        // Clean up FIRST to prevent issues if loading fails
        router.cleanupGameInstance(); 
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Component not found at ${path}`);
            }
            const html = await response.text();
            
            // Ensure container exists before setting innerHTML
            if (!router.appContainer) {
                 console.error('App container lost!');
                 return;
            }
            router.appContainer.innerHTML = html;
            
            // Wait a tiny moment for DOM to potentially update
            await new Promise(resolve => setTimeout(resolve, 0)); 
            
            router.attachComponentListeners(hash);
        } catch (error) {
            console.error('Error loading component:', error);
            if (router.appContainer) {
                 router.appContainer.innerHTML = `<section class="page-container"><h2>Error loading page content.</h2></section>`;
            }
        }
    },
    
    attachComponentListeners: (hash) => {
         // Add null checks for safety
         try {
            const toggleIcons = document.querySelectorAll('.password-toggle');
            toggleIcons.forEach(icon => {
                icon.addEventListener('click', router.togglePasswordVisibility);
            });
            if (hash === '#signup') {
                const form = document.getElementById('signup-form');
                if (form) form.addEventListener('submit', auth.handleSignup);
                else console.warn('Signup form not found');
            } 
            else if (hash === '#login') {
                const form = document.getElementById('login-form');
                if (form) form.addEventListener('submit', auth.handleLogin);
                 else console.warn('Login form not found');
            }
            else if (hash === '#donate') {
                const form = document.getElementById('donate-form');
                if (form) form.addEventListener('submit', router.handleDonationSubmit);
                 else console.warn('Donate form not found');
            }
            else if (hash === '#game') {
                router.loadGameData(); // Loads high score AND leaderboard
                router.loadUnityGame(); // Loads the game canvas and scripts
            }
         } catch (error) {
             console.error("Error attaching listeners:", error);
         }
    },

    togglePasswordVisibility: (e) => {
        const iconSpan = e.currentTarget; 
        const targetInputId = iconSpan.getAttribute('data-target');
        const targetInput = document.getElementById(targetInputId);
        if (!targetInput) return;
        const iconShow = iconSpan.querySelector('.icon-eye');
        const iconHide = iconSpan.querySelector('.icon-eye-slash');
        // Add null checks for icons too
        if (!iconShow || !iconHide) return; 
        if (targetInput.type === 'password') {
            targetInput.type = 'text';
            iconShow.classList.add('hidden');
            iconHide.classList.remove('hidden');
        } else {
            targetInput.type = 'password';
            iconShow.classList.remove('hidden');
            iconHide.classList.add('hidden');
        }
    },
    
    handleDonationSubmit: async (e) => {
        e.preventDefault();
        const amountInput = document.getElementById('donate-amount');
        if (!amountInput) return;
        const amount = amountInput.value;
        if (!amount || amount <= 0) {
          ui.displayError("Please enter a valid amount.");
          return;
        }
        const { donation, error } = await api.makeDonation(amount);
        if (error) {
          ui.displayError(error);
        } else {
          ui.displaySuccess(`Thank you for your $${donation.amount} donation!`);
          const form = document.getElementById('donate-form');
          if (form) form.reset();
        }
    },
    
    loadGameData: async () => {
        // 1. Fetch the user's high score
        const { gameData, error } = await api.getGameData();
        const highScoreEl = document.getElementById('high-score');
        if (highScoreEl) { // Check if element exists
            if (gameData) {
                highScoreEl.textContent = gameData.highScore || 0;
            } else {
                highScoreEl.textContent = 0;
                console.warn("Could not load user's high score:", error);
            }
        } else {
            console.warn("High score element not found in DOM");
        }

        // 2. Fetch the global leaderboard
       router.loadLeaderboardData(); 
    },

    loadLeaderboardData: async () => {
        const listElement = document.getElementById('leaderboard-list'); // Get element first
        if (!listElement) {
             console.warn("Leaderboard list element not found in DOM");
             return; // Don't fetch if no place to put it
        }

        const { gameData: leaderboard, error: leaderboardError } = await api.getLeaderboard();
        if (leaderboard) {
            router.populateLeaderboard(leaderboard);
        } else {
             listElement.innerHTML = '<li class="leaderboard-item" style="color: red;">Could not load leaderboard.</li>';
             console.error("Could not load leaderboard:", leaderboardError);
        }
    },

    // --- *** THIS FUNCTION IS UPDATED *** ---
    populateLeaderboard: (leaderboard) => {
        const listElement = document.getElementById('leaderboard-list');
        if (!listElement) {
             console.warn("Cannot populate: Leaderboard list element not found in DOM");
             return;
        }

        listElement.innerHTML = ''; // Clear existing list

        if (!leaderboard || leaderboard.length === 0) {
            listElement.innerHTML = '<li class="leaderboard-item"><span>No scores yet!</span><span></span></li>';
            return;
        }

        const emojis = ['👑', '🥈', '🥉'];
        const classes = ['top-1', 'top-2', 'top-3'];

        leaderboard.forEach((user, index) => {
            const li = document.createElement('li');
            li.classList.add('leaderboard-item');

            const rank = index + 1;
            let nameSpanContent = ''; // Start empty

            // --- *** MODIFIED LOGIC FOR NAME SPAN *** ---
            if (rank <= 3) {
                li.classList.add(classes[index]);
                // Add Emoji + Rank + Name for top 3
                nameSpanContent = `${emojis[index]} ${rank}. ${user.username || 'Anonymous'}`; 
            } else {
                // Add Rank + Name for others
                nameSpanContent = `${rank}. ${user.username || 'Anonymous'}`;
            }
            // --- *** END OF MODIFIED LOGIC *** ---

            const nameSpan = document.createElement('span');
            nameSpan.textContent = nameSpanContent;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = user.highScore || 0; 

            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            
            listElement.appendChild(li);
        });
    },
    
    loadUnityGame: () => {
        // 1. Add the Unity CSS to the <head> (only if not already added)
        if (!document.getElementById('unity-game-css')) {
            const unityCSS = document.createElement('link');
            unityCSS.id = 'unity-game-css'; 
            unityCSS.rel = 'stylesheet';
            unityCSS.href = 'unitygame/TemplateData/style.css'; 
            document.head.appendChild(unityCSS);
        }

        // 2. Define the game config
        var buildUrl = "unitygame/Build"; 
        var loaderUrl = buildUrl + "/B2.loader.js";
        
        console.log("Loading Unity from buildUrl:", buildUrl);

        var config = {
            arguments: [],
            dataUrl: buildUrl + "/B2.data",
            frameworkUrl: buildUrl + "/B2.framework.js",
            codeUrl: buildUrl + "/B2.wasm",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "Team Lima",
            productName: "Re-Flow",
            productVersion: "0.1.0",
            showBanner: router.unityShowBanner,
        };

        // 3. Find the canvas and other elements (with checks)
        var canvas = document.querySelector("#unity-canvas");
        var unityContainer = document.querySelector("#unity-container");
        var loadingBar = document.querySelector("#unity-loading-bar");
        var progressBar = document.querySelector("#unity-progress-bar-full");
        var fullscreenBtn = document.querySelector("#unity-fullscreen-button");


        if (!canvas || !unityContainer || !loadingBar || !progressBar || !fullscreenBtn) {
            console.error("One or more required Unity elements not found in the DOM!");
            if (loadingBar) loadingBar.innerHTML = '<p style="color: red;">Error: Could not find required page elements to load game.</p>';
            return;
        }

        // 4. Apply styles/mobile settings
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
             if (!document.getElementById('unity-viewport-meta')) { // Add meta only once
                var meta = document.createElement('meta');
                meta.id = 'unity-viewport-meta'; 
                meta.name = 'viewport';
                meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
                document.getElementsByTagName('head')[0].appendChild(meta);
             }
            unityContainer.className = "unity-mobile";
            canvas.className = "unity-mobile";
        } 
        // No 'else' needed, CSS handles desktop size

        loadingBar.style.display = "block";

        // 5. Load the Unity loader script (only if not already loaded)
        if (!document.getElementById('unity-loader-script')) {
            var script = document.createElement("script");
            script.id = 'unity-loader-script'; 
            script.src = loaderUrl;
            script.onload = () => {
                if (typeof createUnityInstance === 'undefined') {
                    console.error("createUnityInstance function not found. Loader script may have failed.");
                    if(loadingBar) loadingBar.innerHTML = '<p style="color: red;">Error loading game scripts.</p>';
                    return;
                }
                createUnityInstance(canvas, config, (progress) => {
                    if (progressBar) progressBar.style.width = 100 * progress + "%";
                }).then((unityInstance) => {
                    if (loadingBar) loadingBar.style.display = "none";
                    if (fullscreenBtn) fullscreenBtn.onclick = () => {
                        unityInstance.SetFullscreen(1);
                    };
                    router.currentUnityInstance = unityInstance;
                }).catch((message) => {
                    console.error("Error creating Unity Instance:", message);
                    router.unityShowBanner(`Error creating Unity Instance: ${message}`, 'error');
                });
            };
            script.onerror = () => {
                console.error("Failed to load Unity loader script:", loaderUrl);
                if(loadingBar) loadingBar.innerHTML = '<p style="color: red;">Failed to load game scripts.</p>';
            };
            document.body.appendChild(script);
        } else {
             console.warn("Unity loader script already exists. Skipping load.");
        }
    },

    unityShowBanner: (msg, type) => {
        var warningBanner = document.querySelector("#unity-warning");
        if (!warningBanner) return; 
        function updateBannerVisibility() {
            const gameContainerVisible = !!document.getElementById('game-page');
            warningBanner.style.display = (warningBanner.children.length && gameContainerVisible) ? 'block' : 'none';
        }
        var div = document.createElement('div');
        div.innerHTML = msg;
        warningBanner.appendChild(div);
        
        let bgColor = '';
        let textColor = '';
        if (type == 'error') { bgColor = 'red'; textColor = 'white'; }
        else if (type == 'warning') { bgColor = 'yellow'; textColor = 'black'; }
        else { bgColor = '#eee'; textColor = 'black';} 

        div.style = `background: ${bgColor}; color: ${textColor}; padding: 10px; margin-bottom: 5px; border-radius: 3px;`;

        if (type !== 'error') { 
            setTimeout(function() {
                if (warningBanner && warningBanner.contains(div)) {
                    warningBanner.removeChild(div);
                    updateBannerVisibility();
                }
            }, 5000);
        }
        updateBannerVisibility();
    },

    cleanupGameInstance: () => {
        console.log("Attempting to clean up Unity instance...");
        if (router.currentUnityInstance) {
            router.currentUnityInstance.Quit().then(() => {
                console.log("Unity instance quit successfully.");
            }).catch((err) => {
                console.error("Error quitting Unity instance:", err);
            });
            router.currentUnityInstance = null;
        } else {
            console.log("No active Unity instance to quit.");
        }

        const unityCSS = document.getElementById('unity-game-css');
        if (unityCSS) {
            unityCSS.remove();
            console.log("Removed Unity CSS.");
        }

        const unityScript = document.getElementById('unity-loader-script');
        if (unityScript) {
            unityScript.remove(); 
            console.log("Removed Unity loader script tag.");
        }
        
        const viewportMeta = document.getElementById('unity-viewport-meta');
        if (viewportMeta) {
            viewportMeta.remove();
             console.log("Removed Unity viewport meta tag.");
        }
        
         const warningBanner = document.querySelector("#unity-warning");
         if (warningBanner) {
             warningBanner.innerHTML = '';
             warningBanner.style.display = 'none';
         }
    }
};