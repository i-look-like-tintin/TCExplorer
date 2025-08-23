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
        this.performanceLevel = this.assessPerformanceLevel();
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
        
        console.log('Device Manager initialized:', {
            type: this.deviceType,
            orientation: this.orientation,
            touch: this.touchSupport,
            performance: this.performanceLevel
        });
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
    
    //TODO: again, watch this space, might be doing innaccurate fuckiness in firefox live
    //oop it was this lol, think this should help it be less fucky now for my firefox homies
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
            console.log('Device type changed:', oldDeviceType, '->', this.deviceType);
            this.applyDeviceSpecificSettings();
        }
        
        this.adjustLayoutForDevice();
        this.optimizeMapForDevice();
    }
    
    handleOrientationChange() {
        this.orientation = this.getOrientation();
        console.log('Orientation changed to:', this.orientation);
        
        this.adjustLayoutForOrientation();
        this.optimizeControlsForOrientation();
        this.handleMobilePanelOrientationChange();
    }
    
    handleNetworkChange() {
        if (navigator.connection) {
            const connection = navigator.connection;
            console.log('Network changed:', connection.effectiveType);
            
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
        if (controlPanel) {
            controlPanel.style.flexDirection = 'column';
            controlPanel.style.maxHeight = '';
            controlPanel.style.overflowY = 'auto';
            
            this.setupMobileControlPanel(controlPanel);
        }
        
        if (legend) {
            legend.style.bottom = '10px';
            legend.style.right = '10px';
            legend.style.maxWidth = '150px';
            legend.style.fontSize = '11px';
            legend.style.zIndex = '1001';
        }
        
        if (infoPanel) {
            infoPanel.style.position = 'fixed';
            infoPanel.style.bottom = '10px';
            infoPanel.style.left = '10px';
            infoPanel.style.right = '10px';
            infoPanel.style.top = 'auto';
            infoPanel.style.maxHeight = '30vh';
            infoPanel.style.zIndex = '1002'; 
        }
        
        this.optimizeMapControlsForMobile();
    }
    
    setupMobileControlPanel(controlPanel) {
        if (document.getElementById('mobile-panel-toggle')) return;
        
        const toggleButton = document.createElement('button');
        toggleButton.id = 'mobile-panel-toggle';
        toggleButton.className = 'mobile-panel-toggle';
        toggleButton.innerHTML = `
            <span class="toggle-icon">▼</span>
            <span class="toggle-text">Controls</span>
        `;
        toggleButton.setAttribute('aria-label', 'Toggle control panel');
        toggleButton.setAttribute('aria-expanded', 'true');
        
        const panelWrapper = document.createElement('div');
        panelWrapper.className = 'mobile-panel-wrapper';
        controlPanel.parentNode.insertBefore(panelWrapper, controlPanel);
        panelWrapper.appendChild(toggleButton);
        panelWrapper.appendChild(controlPanel);
        
        controlPanel.classList.add('mobile-collapsible');
        
        this.controlPanelExpanded = false;
        this.toggleMobileControlPanel(false, false); // false = collapsed, false = no animation
        
        toggleButton.addEventListener('click', () => {
            this.toggleMobileControlPanel(!this.controlPanelExpanded, true);
        });
        
        this.addMobileControlPanelStyles();
    }
    
    toggleMobileControlPanel(expand, animate = true) {
        const controlPanel = document.getElementById('control-panel');
        const toggleButton = document.getElementById('mobile-panel-toggle');
        const toggleIcon = toggleButton?.querySelector('.toggle-icon');
        
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
        
        const resizeMap = () => {
            if (this.app.mapManager && this.app.mapManager.map) {
                setTimeout(() => {
                    this.app.mapManager.map.invalidateSize(true);
                }, 50);
                
                setTimeout(() => {
                    this.app.mapManager.map.invalidateSize(true);
                }, animate ? 350 : 100);
            }
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
    
    addMobileControlPanelStyles() {
        // Check if styles already added
        if (document.getElementById('mobile-panel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mobile-panel-styles';
        style.textContent = `
            .mobile-panel-wrapper {
                position: relative;
                z-index: 1000;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                flex-shrink: 0;
            }
            
            .mobile-panel-toggle {
                width: 100%;
                padding: 12px 16px;
                background: #34495e;
                color: white;
                border: none;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: background-color 0.2s ease;
                min-height: 48px;
                touch-action: manipulation;
            }
            
            .mobile-panel-toggle:hover,
            .mobile-panel-toggle:focus {
                background: #2c3e50;
                outline: none;
            }
            
            .mobile-panel-toggle:active {
                background: #1a252f;
            }
            
            .toggle-icon {
                font-size: 14px;
                transition: transform 0.3s ease;
                margin-right: 8px;
            }
            
            .toggle-text {
                flex: 1;
                text-align: left;
            }
            
            .mobile-collapsible {
                overflow: hidden;
                transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
            }
            
            .mobile-collapsible.collapsed {
                max-height: 0 !important;
                opacity: 0;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }
            
            .mobile-collapsible.expanded {
                max-height: 400px !important;
                opacity: 1;
            }
            
            .mobile-collapsible.transitioning {
                transition: max-height 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out;
            }
            
            /* Ensure proper layout on mobile */
            @media (max-width: 768px) {
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
                
                #map {
                    width: 100%;
                    height: 100%;
                }
                
                .mobile-panel-wrapper {
                    flex-shrink: 0;
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
            if (this.orientation === 'landscape') {
                if (controlPanel) {
                    controlPanel.style.maxHeight = '120px';
                }
            } else {
                if (controlPanel) {
                    controlPanel.style.maxHeight = '200px';
                }
            }
        }
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
    
    addMobileZoomControls(map) {s
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
    
    //TODO: maybe this is causing low performance mode to be activated incorrectly with firefox. watch this space lol
    //yea i think fixed now
optimizeDataLoading() {
    if (this.performanceLevel === 'low' && (this.isSlowConnection() || this.isMobile())) {
        this.enableLowPerformanceMode();
    } else if (this.performanceLevel === 'high') {
        this.enableHighPerformanceMode();
    }
}
    
    //yea look, these are probs whats causing issues. hard to replicate locally tho, might have to test in prod again lol
    enableLowPerformanceMode() {
        console.log('Enabling low performance mode');
        
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.gridResolution = 4; // Lower resolution
        }
        
        this.maxCyclonesToDisplay = 50;
        
        this.disableAnimations();
    }
    
    enableHighPerformanceMode() {
        console.log('Enabling high performance mode');
        
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
        console.log('Forcing complete layout refresh...');
        
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
        
        console.log('Layout refresh complete:', {
            oldDeviceType,
            newDeviceType: this.deviceType,
            mapContainer: document.getElementById('map-container'),
            controlPanel: document.getElementById('control-panel')
        });
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
}