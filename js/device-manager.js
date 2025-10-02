/**
 * Device Manager
 * Handles device detection, responsive layout adjustments, and platform-specific optimizations
 */
class DeviceManager {
    constructor(app) {
        this.app = app;
        
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            largeDesktop: 1440
        };
        
        this.deviceType = this.detectDeviceType();
        this.orientation = this.getOrientation();
        this.touchSupport = this.detectTouchSupport();
        this.performanceLevel = 'high' //this.assessPerformanceLevel();
        this.controlPanelExpanded = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.applyDeviceSpecificSettings();
        this.adjustLayoutForDevice();
        
        setTimeout(() => {
            this.checkFirstTimeUser();
        }, 1000);
    }
    
    detectDeviceType() {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipod/.test(userAgent)) return 'mobile-ios';
        if (/ipad/.test(userAgent)) return 'tablet-ios';
        if (/android/.test(userAgent)) {
            return width < this.breakpoints.tablet ? 'mobile-android' : 'tablet-android';
        }
        
        if (width <= this.breakpoints.mobile) return 'mobile';
        if (width <= this.breakpoints.tablet) return 'tablet';
        if (width <= this.breakpoints.desktop) return 'desktop';
        return 'large-desktop';
    }
    
    detectTouchSupport() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }
    
    getOrientation() {
        if (window.innerHeight > window.innerWidth) {
            return 'portrait';
        }
        return 'landscape';
    }
    
    // Note: Firefox performance metrics may require special handling
    // Improved browser compatibility for performance assessment
    assessPerformanceLevel() {
    const nav = navigator;
    let score = 0;
    
    if (nav.hardwareConcurrency) {
        if (nav.hardwareConcurrency >= 8) score += 3;
        else if (nav.hardwareConcurrency >= 4) score += 2;
        else if (nav.hardwareConcurrency >= 2) score += 1;
    } else {
        if (this.isDesktop()) score += 2;
        else if (this.isTablet()) score += 1;
    }
    
    if (nav.deviceMemory) {
        if (nav.deviceMemory >= 8) score += 3;
        else if (nav.deviceMemory >= 4) score += 2;
        else if (nav.deviceMemory >= 2) score += 1;
    } else {
        const screenPixels = window.screen.width * window.screen.height;
        if (this.isDesktop()) {
            if (screenPixels > 2073600) score += 3; // > 1920x1080
            else score += 2;
        } else if (this.isTablet()) {
            score += 1;
        }
    }
    
    const performanceBonus = this.runSimplePerformanceTest();
    score += performanceBonus;
    
    const userAgent = nav.userAgent.toLowerCase();
    if (userAgent.includes('firefox')) {
        score += 1;
    }
    
    if (this.isMobile()) score -= 2;
    else if (this.isTablet()) score -= 1;
    
    if (this.supportsWebGL()) score += 1;
    if (this.supportsCanvas()) score += 1;
    
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
}

runSimplePerformanceTest() {
    try {
        const start = performance.now();
        
        //this just a simple maths test for user's browser to assess performance on non-chromium boys
        let result = 0;
        for (let i = 0; i < 10000; i++) {
            result += Math.random() * Math.sin(i);
        }
        
        const duration = performance.now() - start;
        
        if (duration < 2) return 2;
        if (duration < 5) return 1;
        return 0;
    } catch (error) {
        return 0;
    }
}

    setupEventListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.handleNetworkChange();
            });
        }
        
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    handleResize() {
        const oldDeviceType = this.deviceType;
        this.deviceType = this.detectDeviceType();
        this.orientation = this.getOrientation();
        
        if (oldDeviceType !== this.deviceType) {
            this.applyDeviceSpecificSettings();
        }
        
        this.adjustLayoutForDevice();
        this.optimizeMapForDevice();
    }
    
    handleOrientationChange() {
        this.orientation = this.getOrientation();

        this.adjustLayoutForOrientation();
        this.optimizeControlsForOrientation();
        // Don't auto-handle panel changes - keep current state
        // this.handleMobilePanelOrientationChange();
    }
    
    handleNetworkChange() {
        if (navigator.connection) {
            const connection = navigator.connection;
            
            this.adjustDataLoadingStrategy();
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseNonEssentialOperations();
        } else {
            this.resumeOperations();
        }
    }
    
    applyDeviceSpecificSettings() {
        const body = document.body;
        
        body.classList.remove('mobile', 'tablet', 'desktop', 'large-desktop', 'touch', 'no-touch');
        
        body.classList.add(this.getDeviceCategory());
        body.classList.add(this.touchSupport ? 'touch' : 'no-touch');
        body.classList.add(`performance-${this.performanceLevel}`);
        
        this.optimizeMapForDevice();
        this.adjustInteractionMethods();
        this.optimizeDataLoading();
    }
    
    adjustLayoutForDevice() {
        const controlPanel = document.getElementById('control-panel');
        const legend = document.getElementById('legend');
        const infoPanel = document.getElementById('info-panel');
        
        if (this.isMobile()) {
            this.applyMobileLayout(controlPanel, legend, infoPanel);
        } else if (this.isTablet()) {
            this.applyTabletLayout(controlPanel, legend, infoPanel);
        } else {
            this.applyDesktopLayout(controlPanel, legend, infoPanel);
        }
    }
    
    applyMobileLayout(controlPanel, legend, infoPanel) {
        // Simplified mobile approach - just create a simple menu button
        this.setupSimpleMobileFAB(controlPanel, legend, infoPanel);

        if (legend) {
            // Hide legend initially on mobile
            legend.style.display = 'none';
            legend.style.position = 'fixed';
            legend.style.bottom = '80px';
            legend.style.right = '20px';
            legend.style.maxWidth = '100px';
            legend.style.maxHeight = '150px';
            legend.style.fontSize = '10px';
            legend.style.padding = '0.4rem';
            legend.style.zIndex = '1001';
            legend.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            legend.style.borderRadius = '8px';
            legend.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        }

        if (infoPanel) {
            // Info panel as overlay when needed
            infoPanel.style.position = 'fixed';
            infoPanel.style.bottom = '20px';
            infoPanel.style.left = '10px';
            infoPanel.style.right = '10px';
            infoPanel.style.top = 'auto';
            infoPanel.style.maxHeight = '30vh';
            infoPanel.style.fontSize = '0.75rem';
            infoPanel.style.padding = '0.5rem';
            infoPanel.style.zIndex = '1002';
            infoPanel.style.borderRadius = '8px';
            infoPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        }

        // Hide any scenario comparison panels on mobile
        const scenarioComparison = document.querySelector('.scenario-comparison');
        if (scenarioComparison) {
            scenarioComparison.style.display = 'none';
        }
        const scenarioComparisonById = document.getElementById('scenario-comparison');
        if (scenarioComparisonById) {
            scenarioComparisonById.style.display = 'none';
        }

        this.optimizeMapControlsForMobile();
    }
    
    // Simplified mobile FAB
    setupSimpleMobileFAB(controlPanel, legend, infoPanel) {
        // Check if already created and update if needed
        let existingFab = document.getElementById('simple-mobile-fab');
        let existingPanel = document.getElementById('mobile-controls-wrapper');

        if (existingFab && existingPanel) {
            // Just update positions for orientation
            if (window.innerHeight < window.innerWidth) {
                existingFab.style.bottom = '10px';
                existingFab.style.right = '10px';
                existingFab.style.width = '48px';
                existingFab.style.height = '48px';
                existingFab.style.fontSize = '20px';
                existingPanel.style.maxHeight = '80vh';
            } else {
                existingFab.style.bottom = '20px';
                existingFab.style.right = '20px';
                existingFab.style.width = '56px';
                existingFab.style.height = '56px';
                existingFab.style.fontSize = '24px';
                existingPanel.style.maxHeight = '70vh';
            }
            return;
        }

        // Create simple FAB button with inline styles to ensure visibility
        const fab = document.createElement('button');
        fab.id = 'simple-mobile-fab';
        fab.className = 'mobile-menu-fab';
        fab.innerHTML = '☰';
        fab.setAttribute('aria-label', 'Menu');

        // Force inline styles to absolutely ensure visibility
        fab.style.position = 'fixed';
        fab.style.bottom = '20px';
        fab.style.right = '20px';
        fab.style.width = '56px';
        fab.style.height = '56px';
        fab.style.background = '#3498db';
        fab.style.borderRadius = '50%';
        fab.style.border = 'none';
        fab.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        fab.style.zIndex = '99999';
        fab.style.display = 'flex';
        fab.style.alignItems = 'center';
        fab.style.justifyContent = 'center';
        fab.style.cursor = 'pointer';
        fab.style.color = 'white';
        fab.style.fontSize = '24px';
        fab.style.WebkitAppearance = 'none';
        fab.style.MozAppearance = 'none';
        fab.style.appearance = 'none';
        fab.style.touchAction = 'manipulation';
        fab.style.pointerEvents = 'auto';

        // Adjust for landscape
        if (window.innerHeight < window.innerWidth) {
            fab.style.bottom = '10px';
            fab.style.right = '10px';
            fab.style.width = '48px';
            fab.style.height = '48px';
            fab.style.fontSize = '20px';
        }

        document.body.appendChild(fab);

        // Create controls panel
        let panel = document.getElementById('mobile-controls-wrapper');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'mobile-controls-wrapper';
            panel.className = 'mobile-controls-panel';
            panel.innerHTML = `
                <div class="mobile-controls-header">
                    <h3>Controls</h3>
                    <button id="close-mobile-controls" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 36px;
                        height: 36px;
                        font-size: 20px;
                        cursor: pointer;
                    ">×</button>
                </div>
                <div id="mobile-controls-content" style="padding: 15px;"></div>
            `;
            document.body.appendChild(panel);
        }

        // Move control panel to mobile panel
        if (controlPanel) {
            const content = document.getElementById('mobile-controls-content');
            content.appendChild(controlPanel);
            controlPanel.style.display = 'block';
            controlPanel.style.background = 'none';
            controlPanel.style.boxShadow = 'none';
        }

        // Add legend toggle button
        const controlsHeader = panel.querySelector('.mobile-controls-header');
        const legendToggle = document.createElement('button');
        legendToggle.id = 'mobile-legend-toggle';
        legendToggle.innerHTML = '📊';
        legendToggle.style.cssText = `
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            font-size: 18px;
            cursor: pointer;
            margin-left: 10px;
        `;
        legendToggle.setAttribute('aria-label', 'Toggle legend');
        controlsHeader.insertBefore(legendToggle, controlsHeader.lastChild);

        // Setup interactions - use simple click for Firefox compatibility
        fab.onclick = function() {
            if (panel.style.transform === 'translateY(0px)' || panel.classList.contains('show')) {
                panel.style.transform = 'translateY(100%)';
                panel.classList.remove('show');
            } else {
                panel.style.transform = 'translateY(0px)';
                panel.classList.add('show');
            }
        };

        const closeBtn = document.getElementById('close-mobile-controls');
        if (closeBtn) {
            closeBtn.onclick = function() {
                panel.style.transform = 'translateY(100%)';
                panel.classList.remove('show');
            };
        }

        if (legendToggle && legend) {
            legendToggle.onclick = function() {
                const isHidden = legend.style.display === 'none' || !legend.style.display;
                legend.style.display = isHidden ? 'block' : 'none';
                legendToggle.style.background = isHidden ? '#f39c12' : '#27ae60';
            };
        }

        // Set panel initial styles
        panel.style.position = 'fixed';
        panel.style.bottom = '0';
        panel.style.left = '0';
        panel.style.right = '0';
        panel.style.background = 'white';
        panel.style.transform = 'translateY(100%)';
        panel.style.transition = 'transform 0.3s ease';
        panel.style.zIndex = '99998';
        panel.style.maxHeight = window.innerHeight < window.innerWidth ? '80vh' : '70vh';
        panel.style.overflowY = 'auto';
        panel.style.borderRadius = '20px 20px 0 0';
        panel.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';

        // Ensure FAB is clickable
        fab.style.pointerEvents = 'auto';
        fab.style.cursor = 'pointer';

        // Add tutorial restart button to mobile controls
        this.addMobileTutorialButton();

        // Debug logging
    }

    addMobileTutorialButton() {
        const mobileControls = document.getElementById('mobile-controls-content');
        if (mobileControls && this.app && this.app.tutorialManager) {
            // Check if already added
            if (document.getElementById('mobile-tutorial-restart')) return;

            // Wait a bit to ensure UI Controller has had a chance to add its button
            setTimeout(() => {
                // Check again if UI Controller hasn't added it
                if (!document.getElementById('mobile-tutorial-restart')) {
                    const tutorialGroup = document.createElement('div');
                    tutorialGroup.className = 'control-group';
                    tutorialGroup.style.marginTop = '10px';
                    tutorialGroup.innerHTML = `
                        <button id="mobile-tutorial-restart" class="export-btn" style="width: 100%;">
                            📚 Restart Tutorial
                        </button>
                    `;

                    // Add event listener
                    const tutorialBtn = tutorialGroup.querySelector('#mobile-tutorial-restart');
                    tutorialBtn.addEventListener('click', () => {
                        if (this.app.tutorialManager) {
                            this.app.tutorialManager.restartTutorial();
                        }
                    });

                    mobileControls.appendChild(tutorialGroup);
                }
            }, 100);
        }
    }

    // Old FAB system - keeping for reference but not using
    setupMobileFABSystem(controlPanel, legend, infoPanel) {
        // Check if FAB already exists
        if (document.getElementById('mobile-fab-menu')) {
            // FAB exists, just ensure control panel is in the overlay
            const overlay = document.getElementById('mobile-overlay');
            if (overlay && controlPanel) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent && !overlayContent.contains(controlPanel)) {
                    overlayContent.appendChild(controlPanel);
                    controlPanel.style.display = 'block';
                    controlPanel.style.maxHeight = 'none';
                    controlPanel.style.overflowY = 'auto';
                }
            }
            return;
        }

        // Create FAB container
        const fabContainer = document.createElement('div');
        fabContainer.id = 'mobile-fab-container';
        fabContainer.innerHTML = `
            <div id="mobile-fab-menu" class="fab-menu">
                <button id="fab-main" class="fab-button fab-main" aria-label="Menu">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                </button>
                <div class="fab-actions">
                    <button id="fab-controls" class="fab-button fab-action" aria-label="Controls">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </button>
                    <button id="fab-legend" class="fab-button fab-action" aria-label="Legend">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(fabContainer);

        // Create mobile overlay for controls if it doesn't exist
        if (!document.getElementById('mobile-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'mobile-overlay';
            overlay.className = 'mobile-overlay';
            overlay.innerHTML = `
                <div class="overlay-header">
                    <h3>Controls</h3>
                    <button class="overlay-close" aria-label="Close">×</button>
                </div>
                <div class="overlay-content"></div>
            `;
            document.body.appendChild(overlay);
        }

        // Move control panel content to overlay
        if (controlPanel) {
            const overlay = document.getElementById('mobile-overlay');
            const overlayContent = overlay.querySelector('.overlay-content');
            overlayContent.appendChild(controlPanel);
            controlPanel.style.display = 'block';
            controlPanel.style.maxHeight = 'none';
            controlPanel.style.overflowY = 'auto';
        }

        this.setupFABInteractions(controlPanel, legend, document.getElementById('mobile-overlay'));
        this.addMobileFABStyles();
    }
    
    toggleMobileControlPanel(expand, animate = true) {
        const controlPanel = document.getElementById('control-panel');
        const toggleButton = document.getElementById('mobile-panel-toggle');
        const toggleIcon = toggleButton?.querySelector('.toggle-icon');
        const legend = document.getElementById('legend');

        if (!controlPanel || !toggleButton) return;

        this.controlPanelExpanded = expand;

        toggleButton.setAttribute('aria-expanded', expand.toString());
        if (toggleIcon) {
            toggleIcon.textContent = expand ? '▲' : '▼';
        }

        if (animate) {
            controlPanel.classList.add('transitioning');
        }

        if (expand) {
            controlPanel.classList.remove('collapsed');
            controlPanel.classList.add('expanded');
        } else {
            controlPanel.classList.remove('expanded');
            controlPanel.classList.add('collapsed');
        }

        // Adjust legend position based on control panel state
        if (legend && this.orientation === 'portrait') {
            const legendBottom = expand ? '410px' : '60px';
            legend.style.bottom = legendBottom;
            legend.style.transition = animate ? 'bottom 0.3s ease' : 'none';
        }

        const resizeMap = () => {
            if (this.app.mapManager && this.app.mapManager.map) {
                setTimeout(() => {
                    this.app.mapManager.map.invalidateSize(true);
                }, 50);

                setTimeout(() => {
                    this.app.mapManager.map.invalidateSize(true);
                }, animate ? 350 : 100);
            }

            // Ensure elements are within viewport after toggle
            this.ensureElementsWithinViewport();
        };

        if (animate) {
            setTimeout(() => {
                controlPanel.classList.remove('transitioning');
                resizeMap();
            }, 300);
        } else {
            resizeMap();
        }
    }
    
    addMobileFABStyles() {
        // Check if styles already added
        if (document.getElementById('mobile-fab-styles')) return;

        const style = document.createElement('style');
        style.id = 'mobile-fab-styles';
        style.textContent = `
            /* FAB System Styles */
            #mobile-fab-container {
                display: none;
            }

            @media (max-width: 768px) {
                #mobile-fab-container {
                    display: block;
                }

                /* FAB Menu */
                .fab-menu {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 2000;
                }

                .fab-button {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }

                .fab-main {
                    background: #3498db;
                    position: relative;
                    z-index: 2;
                }

                .fab-main:active {
                    transform: scale(0.95);
                }

                .fab-actions {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .fab-actions.open {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(-70px);
                }

                .fab-action {
                    width: 44px;
                    height: 44px;
                    background: #27ae60;
                    transform: scale(0);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .fab-actions.open .fab-action {
                    transform: scale(1);
                }

                .fab-action:nth-child(1) {
                    transition-delay: 0.05s;
                }

                .fab-action:nth-child(2) {
                    transition-delay: 0.1s;
                    background: #e74c3c;
                }

                .fab-action.active {
                    background: #f39c12;
                }

                /* Mobile Overlay */
                .mobile-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1999;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .mobile-overlay.show {
                    opacity: 1;
                    pointer-events: auto;
                }

                .mobile-overlay.show .overlay-content {
                    transform: translateY(0);
                }

                .overlay-header {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 2px solid #3498db;
                    z-index: 2001;
                }

                .overlay-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 18px;
                }

                .overlay-close {
                    width: 36px;
                    height: 36px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .overlay-content {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    max-height: 70vh;
                    overflow-y: auto;
                    padding: 60px 15px 15px;
                    border-radius: 20px 20px 0 0;
                    transform: translateY(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Landscape adjustments */
                @media (max-width: 768px) and (orientation: landscape) {
                    .fab-menu {
                        bottom: 10px;
                        right: 10px;
                        display: block !important; /* Force visible in landscape */
                    }

                    #mobile-fab-container {
                        display: block !important; /* Ensure container is visible */
                    }

                    .fab-button {
                        width: 44px;
                        height: 44px;
                    }

                    .fab-action {
                        width: 36px;
                        height: 36px;
                    }

                    .fab-actions.open {
                        transform: translateY(-55px);
                    }

                    .overlay-content {
                        max-height: 75vh;
                        padding-top: 50px;
                    }

                    .overlay-header {
                        padding: 10px;
                    }

                    .overlay-header h3 {
                        font-size: 16px;
                    }

                    .overlay-close {
                        width: 32px;
                        height: 32px;
                        font-size: 20px;
                    }
                }

                /* Ensure mobile layout */
                #app-container {
                    height: 100vh;
                    height: -webkit-fill-available;
                }

                /* Hide desktop header elements on mobile landscape */
                @media (max-width: 768px) and (orientation: landscape) {
                    header {
                        min-height: 25px !important;
                    }

                    #map-container {
                        padding-top: 25px;
                    }
                }
            }
            
            /* Desktop and tablet - hide toggle button and ensure normal layout */
            @media (min-width: 769px) {
                .mobile-panel-toggle {
                    display: none !important;
                }
                
                .mobile-collapsible {
                    max-height: none !important;
                    opacity: 1 !important;
                    transition: none !important;
                }
                
                .mobile-collapsible.collapsed {
                    max-height: none !important;
                    opacity: 1 !important;
                    padding: 1rem !important;
                }
                
                .mobile-panel-wrapper {
                    flex-shrink: 0;
                }
                
                #app-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                #map-container {
                    flex: 1;
                    min-height: 0;
                    overflow: hidden;
                }
            }
            
            /* Pulse animation for first-time users */
            .mobile-panel-toggle.pulse {
                animation: controlPanelPulse 2s ease-in-out 3;
            }
            
            @keyframes controlPanelPulse {
                0%, 100% { background: #34495e; }
                50% { background: #3498db; }
            }
        `;
        document.head.appendChild(style);
    }
    
    applyTabletLayout(controlPanel, legend, infoPanel) {
        if (controlPanel) {
            controlPanel.style.flexDirection = 'row';
            controlPanel.style.flexWrap = 'wrap';
            controlPanel.style.maxHeight = '180px';
        }
        
        if (legend) {
            legend.style.bottom = '20px';
            legend.style.right = '20px';
            legend.style.maxWidth = '200px';
        }
        
        if (infoPanel) {
            infoPanel.style.position = 'absolute';
            infoPanel.style.top = '20px';
            infoPanel.style.right = '20px';
            infoPanel.style.maxWidth = '250px';
        }
    }
    
    applyDesktopLayout(controlPanel, legend, infoPanel) {
        if (controlPanel) {
            controlPanel.style.flexDirection = 'row';
            controlPanel.style.flexWrap = 'wrap';
            controlPanel.style.maxHeight = 'none';
            controlPanel.style.overflowY = 'visible';
        }
        
        if (legend) {
            legend.style.bottom = '20px';
            legend.style.right = '20px';
            legend.style.maxWidth = '300px';
            legend.style.fontSize = '14px';
        }
        
        if (infoPanel) {
            infoPanel.style.position = 'absolute';
            infoPanel.style.top = '20px';
            infoPanel.style.left = '20px';
            infoPanel.style.maxWidth = '280px';
        }
    }
    
    adjustLayoutForOrientation() {
        const body = document.body;
        body.classList.remove('portrait', 'landscape');
        body.classList.add(this.orientation);

        if (this.isMobile()) {
            const controlPanel = document.getElementById('control-panel');
            const legend = document.getElementById('legend');
            const infoPanel = document.getElementById('info-panel');

            if (this.orientation === 'landscape') {
                if (controlPanel) {
                    controlPanel.style.maxHeight = '120px';
                }
            } else {
                if (controlPanel) {
                    controlPanel.style.maxHeight = '200px';
                }
            }

            // Update FAB position for orientation
            const fab = document.getElementById('simple-mobile-fab');
            if (fab) {
                if (this.orientation === 'landscape') {
                    fab.style.bottom = '10px !important';
                    fab.style.right = '10px !important';
                    fab.style.width = '48px !important';
                    fab.style.height = '48px !important';
                    fab.style.fontSize = '20px !important';
                } else {
                    fab.style.bottom = '20px !important';
                    fab.style.right = '20px !important';
                    fab.style.width = '56px !important';
                    fab.style.height = '56px !important';
                    fab.style.fontSize = '24px !important';
                }
            }

            // Reapply mobile layout to adjust positions
            this.applyMobileLayout(controlPanel, legend, infoPanel);
        }

        // Ensure everything is within viewport after orientation change
        setTimeout(() => {
            this.ensureElementsWithinViewport();
        }, 100);
    }
    
    // Map-specific optimizations
    optimizeMapForDevice() {
        if (!this.app.mapManager || !this.app.mapManager.map) return;
        
        const map = this.app.mapManager.map;
        
        if (this.isMobile()) {
            map.options.zoomControl = false;
            
            this.addMobileZoomControls(map);
            
            map.options.fadeAnimation = false;
            map.options.zoomAnimation = this.performanceLevel !== 'low';
            
        } else if (this.isTablet()) {
            map.options.zoomAnimation = true;
            map.options.fadeAnimation = this.performanceLevel === 'high';
            
        } else {
            map.options.zoomAnimation = true;
            map.options.fadeAnimation = true;
        }
    }
    
    optimizeMapControlsForMobile() {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.style.touchAction = 'pan-x pan-y';
        }
    }
    
    addMobileZoomControls(map) {
        // Check if zoom controls already exist
        if (document.querySelector('.mobile-zoom-controls')) {
            return;
        }

        // Store reference to prevent duplicates
        if (this.mobileZoomControl) {
            map.removeControl(this.mobileZoomControl);
        }

        const zoomControls = L.control({ position: 'bottomright' });

        zoomControls.onAdd = function() {
            const div = L.DomUtil.create('div', 'mobile-zoom-controls');
            div.innerHTML = `
                <button class="zoom-in" aria-label="Zoom in">+</button>
                <button class="zoom-out" aria-label="Zoom out">−</button>
            `;

            div.querySelector('.zoom-in').addEventListener('click', () => {
                map.zoomIn();
            });

            div.querySelector('.zoom-out').addEventListener('click', () => {
                map.zoomOut();
            });

            return div;
        };

        this.mobileZoomControl = zoomControls;
        zoomControls.addTo(map);
    }
    
    adjustInteractionMethods() {
        if (this.touchSupport) {
            this.optimizeForTouch();
        } else {
            this.optimizeForMouse();
        }
    }
    
    optimizeForTouch() {
        const style = document.createElement('style');
        style.textContent = `
            .scenario-btn, button, select {
                min-height: 44px !important;
                min-width: 44px !important;
            }
            
            .legend-item {
                padding: 8px 4px !important;
            }
            
            .year-slider::-webkit-slider-thumb {
                width: 28px !important;
                height: 28px !important;
            }
            
            .leaflet-popup-content {
                min-width: 200px !important;
                font-size: 16px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    optimizeForMouse() {
        const style = document.createElement('style');
        style.textContent = `
            .scenario-btn:hover, button:hover, select:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .legend-item:hover {
                background-color: rgba(0,0,0,0.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    optimizeControlsForOrientation() {
        const yearRangeContainer = document.querySelector('.year-range-container');
        
        if (this.isMobile() && yearRangeContainer) {
            if (this.orientation === 'landscape') {
                yearRangeContainer.style.width = '200px';
            } else {
                yearRangeContainer.style.width = '100%';
            }
        }
    }
    
    // Performance optimization for different browser capabilities
optimizeDataLoading() {
    if (this.performanceLevel === 'low' && (this.isSlowConnection() || this.isMobile())) {
        this.enableLowPerformanceMode();
    } else if (this.performanceLevel === 'high') {
        this.enableHighPerformanceMode();
    }
}
    
    // Performance mode adjustments for optimal user experience
    enableLowPerformanceMode() {
        
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.gridResolution = 4; // Lower resolution
        }
        
        this.maxCyclonesToDisplay = 50;
        
        this.disableAnimations();
    }
    
    enableHighPerformanceMode() {
        
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.gridResolution = 1;
        }
        
        this.maxCyclonesToDisplay = 500;
        
        this.enableEnhancedAnimations();
    }
    
    adjustDataLoadingStrategy() {
        if (this.isSlowConnection()) {
            // Prioritize essential data only
            this.enableDataCompression();
        }
    }
    
    // Performance monitoring
    pauseNonEssentialOperations() {
        // Pause animations and auto-refresh when tab is hidden
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.pauseAnimations = true;
        }
    }
    
    resumeOperations() {
        // Resume operations when tab becomes visible
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.pauseAnimations = false;
        }
    }
    
    // Utility methods
    isMobile() {
        return this.deviceType.includes('mobile') || window.innerWidth <= this.breakpoints.mobile;
    }
    
    isTablet() {
        return this.deviceType.includes('tablet') || 
               (window.innerWidth > this.breakpoints.mobile && window.innerWidth <= this.breakpoints.tablet);
    }
    
    isDesktop() {
        return window.innerWidth > this.breakpoints.tablet;
    }
    
    isSlowConnection() {
        if (navigator.connection) {
            const connection = navigator.connection;
            return connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g' ||
                   connection.saveData;
        }
        return false;
    }
    
    getDeviceCategory() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }
    
    // Feature detection
    supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     canvas.getContext('webgl'));
        } catch (e) {
            return false;
        }
    }
    
    supportsCanvas() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }
    
    // Animation controls
    disableAnimations() {
        const style = document.createElement('style');
        style.id = 'disable-animations';
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    enableEnhancedAnimations() {
        const existingStyle = document.getElementById('disable-animations');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Add enhanced animations for high-performance devices
        const style = document.createElement('style');
        style.textContent = `
            .scenario-btn {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .legend, .info-panel {
                transition: transform 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    enableDataCompression() {
        // Set headers for data compression requests
        this.preferCompressedData = true;
    }
    
    // Public API for getting device info
    getDeviceInfo() {
        return {
            type: this.deviceType,
            category: this.getDeviceCategory(),
            orientation: this.orientation,
            touchSupport: this.touchSupport,
            performanceLevel: this.performanceLevel,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            features: {
                webgl: this.supportsWebGL(),
                canvas: this.supportsCanvas()
            }
        };
    }
    
    // Method to force layout recalculation
    recalculateLayout() {
        this.handleResize();
        
        // Force map resize if available
        if (this.app.mapManager && this.app.mapManager.map) {
            setTimeout(() => {
                this.app.mapManager.map.invalidateSize(true);
            }, 100);
        }
    }
    
    // Force complete layout refresh - useful for debugging layout issues
    forceLayoutRefresh() {
        
        // Re-detect device type
        const oldDeviceType = this.deviceType;
        this.deviceType = this.detectDeviceType();
        
        // Re-apply device-specific settings
        this.applyDeviceSpecificSettings();
        this.adjustLayoutForDevice();
        
        // Force map resize multiple times to ensure it takes
        if (this.app.mapManager && this.app.mapManager.map) {
            const map = this.app.mapManager.map;
            setTimeout(() => map.invalidateSize(true), 50);
            setTimeout(() => map.invalidateSize(true), 150);
            setTimeout(() => map.invalidateSize(true), 300);
        }
    }
    
    // Mobile control panel management
    showMobileControls() {
        if (this.isMobile()) {
            this.toggleMobileControlPanel(true, true);
        }
    }
    
    hideMobileControls() {
        if (this.isMobile()) {
            this.toggleMobileControlPanel(false, true);
        }
    }
    
    //stub for future use, to create a guide
    checkFirstTimeUser() {
        const isFirstTime = !localStorage.getItem('tc-app-visited');
        
        if (isFirstTime && this.isMobile()) {
            // Show brief guidance for mobile users
            setTimeout(() => {
                this.showFirstTimeGuidance();
            }, 2000);
            
            localStorage.setItem('tc-app-visited', 'true');
        }
    }
    
    showFirstTimeGuidance() {
        const toggleButton = document.getElementById('mobile-panel-toggle');
        
        if (toggleButton) {
            // Add pulse animation to draw attention
            toggleButton.classList.add('pulse');
            
            // Show helpful tip
            this.app.utils.showNotification(
                'Tap "Controls" to show/hide the control panel and maximize map space',
                'info',
                6000
            );
            
            // Remove pulse after animation
            setTimeout(() => {
                toggleButton.classList.remove('pulse');
            }, 6000);
        }
    }
    
    // Handle orientation change for mobile panel
    handleMobilePanelOrientationChange() {
        if (this.isMobile()) {
            const controlPanel = document.getElementById('control-panel');

            if (this.orientation === 'landscape' && this.controlPanelExpanded) {
                // Auto-collapse in landscape for more map space
                this.toggleMobileControlPanel(false, true);

                this.app.utils.showNotification(
                    'Control panel auto-collapsed in landscape mode',
                    'info',
                    3000
                );
            }
        }
    }

    // Setup auto-hide legend when info panel is shown
    setupInfoPanelLegendInteraction(infoPanel, legend) {
        if (!infoPanel || !legend) return;

        // Create observer for info panel visibility
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isHidden = infoPanel.classList.contains('hidden');
                    if (isHidden) {
                        legend.classList.remove('mobile-hidden');
                    } else {
                        // Only hide legend on small mobile screens
                        if (window.innerWidth <= 480) {
                            legend.classList.add('mobile-hidden');
                        }
                    }
                }
            });
        });

        observer.observe(infoPanel, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Setup FAB interactions
    setupFABInteractions(controlPanel, legend, overlay) {
        const fabMain = document.getElementById('fab-main');
        const fabActions = document.querySelector('.fab-actions');
        const fabControls = document.getElementById('fab-controls');
        const fabLegend = document.getElementById('fab-legend');
        const overlayClose = overlay.querySelector('.overlay-close');
        let fabOpen = false;

        // Main FAB toggle
        fabMain.addEventListener('click', () => {
            fabOpen = !fabOpen;
            if (fabOpen) {
                fabActions.classList.add('open');
                fabMain.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                `;
            } else {
                fabActions.classList.remove('open');
                fabMain.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                `;
            }
        });

        // Controls button
        fabControls.addEventListener('click', () => {
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
            fabOpen = false;
            fabActions.classList.remove('open');
            fabMain.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            `;
        });

        // Legend toggle
        fabLegend.addEventListener('click', () => {
            if (legend) {
                const isHidden = legend.style.display === 'none';
                legend.style.display = isHidden ? 'block' : 'none';
                fabLegend.classList.toggle('active', isHidden);
            }
            fabOpen = false;
            fabActions.classList.remove('open');
        });

        // Close overlay
        overlayClose.addEventListener('click', () => {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        });

        // Close overlay on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    // Ensure all UI elements are within viewport boundaries
    ensureElementsWithinViewport() {
        if (!this.isMobile()) return;

        // Don't include scenario-comparison as it should be hidden on mobile
        const elements = [
            document.getElementById('legend'),
            document.getElementById('info-panel')
        ];

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        elements.forEach(element => {
            if (!element || element.classList.contains('hidden')) return;

            const rect = element.getBoundingClientRect();

            // Check if element is cut off at bottom
            if (rect.bottom > viewportHeight) {
                const overflow = rect.bottom - viewportHeight;
                const currentBottom = parseInt(element.style.bottom) || 0;
                element.style.bottom = `${currentBottom + overflow + 10}px`;
            }

            // Check if element is cut off at right
            if (rect.right > viewportWidth) {
                const overflow = rect.right - viewportWidth;
                const currentRight = parseInt(element.style.right) || 0;
                element.style.right = `${currentRight + overflow + 10}px`;
            }

            // Check if element is too tall
            if (rect.height > viewportHeight * 0.5) {
                element.style.maxHeight = '45vh';
                element.style.overflowY = 'auto';
            }

            // Check if element is too wide
            if (rect.width > viewportWidth * 0.5) {
                element.style.maxWidth = '45vw';
            }
        });
    }
}
