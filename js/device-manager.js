/**
 * Device Manager
 * Handles device detection, responsive layout adjustments, and platform-specific optimizations
 */
class DeviceManager {
    constructor(app) {
        this.app = app;
        
        // Define breakpoints first before any methods that depend on them
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            largeDesktop: 1440
        };
        
        // Now initialize properties that depend on breakpoints
        this.deviceType = this.detectDeviceType();
        this.orientation = this.getOrientation();
        this.touchSupport = this.detectTouchSupport();
        this.performanceLevel = this.assessPerformanceLevel();
        this.controlPanelExpanded = false; // Track mobile control panel state
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.applyDeviceSpecificSettings();
        this.adjustLayoutForDevice();
        
        // Check for first-time user after a short delay
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
    
    // Device type detection
    detectDeviceType() {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Check for specific devices
        if (/iphone|ipod/.test(userAgent)) return 'mobile-ios';
        if (/ipad/.test(userAgent)) return 'tablet-ios';
        if (/android/.test(userAgent)) {
            return width < this.breakpoints.tablet ? 'mobile-android' : 'tablet-android';
        }
        
        // General categorization
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
    
    // Performance assessment
    assessPerformanceLevel() {
        const nav = navigator;
        let score = 0;
        
        // Memory check
        if (nav.deviceMemory) {
            if (nav.deviceMemory >= 8) score += 3;
            else if (nav.deviceMemory >= 4) score += 2;
            else if (nav.deviceMemory >= 2) score += 1;
        }
        
        // CPU cores check
        if (nav.hardwareConcurrency) {
            if (nav.hardwareConcurrency >= 8) score += 3;
            else if (nav.hardwareConcurrency >= 4) score += 2;
            else if (nav.hardwareConcurrency >= 2) score += 1;
        }
        
        // Connection check
        if (nav.connection) {
            const connection = nav.connection;
            if (connection.effectiveType === '4g') score += 2;
            else if (connection.effectiveType === '3g') score += 1;
        }
        
        // Device type penalty
        if (this.isMobile()) score -= 2;
        else if (this.isTablet()) score -= 1;
        
        if (score >= 6) return 'high';
        if (score >= 3) return 'medium';
        return 'low';
    }
    
    // Event listeners
    setupEventListeners() {
        // Resize handler with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Orientation change handler
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Network change handler
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.handleNetworkChange();
            });
        }
        
        // Visibility change for performance optimization
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    // Event handlers
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
    
    // Device-specific optimizations
    applyDeviceSpecificSettings() {
        const body = document.body;
        
        // Remove previous device classes
        body.classList.remove('mobile', 'tablet', 'desktop', 'large-desktop', 'touch', 'no-touch');
        
        // Add current device classes
        body.classList.add(this.getDeviceCategory());
        body.classList.add(this.touchSupport ? 'touch' : 'no-touch');
        body.classList.add(`performance-${this.performanceLevel}`);
        
        // Apply device-specific settings
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
        // Mobile-specific layout adjustments
        if (controlPanel) {
            controlPanel.style.flexDirection = 'column';
            controlPanel.style.maxHeight = '200px';
            controlPanel.style.overflowY = 'auto';
            
            // Add mobile control panel functionality
            this.setupMobileControlPanel(controlPanel);
        }
        
        if (legend) {
            legend.style.bottom = '10px';
            legend.style.right = '10px';
            legend.style.maxWidth = '150px';
            legend.style.fontSize = '11px';
        }
        
        if (infoPanel) {
            infoPanel.style.position = 'fixed';
            infoPanel.style.bottom = '10px';
            infoPanel.style.left = '10px';
            infoPanel.style.right = '10px';
            infoPanel.style.top = 'auto';
            infoPanel.style.maxHeight = '30vh';
        }
        
        // Reduce map controls for mobile
        this.optimizeMapControlsForMobile();
    }
    
    setupMobileControlPanel(controlPanel) {
        // Check if toggle button already exists
        if (document.getElementById('mobile-panel-toggle')) return;
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'mobile-panel-toggle';
        toggleButton.className = 'mobile-panel-toggle';
        toggleButton.innerHTML = `
            <span class="toggle-icon">▼</span>
            <span class="toggle-text">Controls</span>
        `;
        toggleButton.setAttribute('aria-label', 'Toggle control panel');
        toggleButton.setAttribute('aria-expanded', 'true');
        
        // Create wrapper for better control
        const panelWrapper = document.createElement('div');
        panelWrapper.className = 'mobile-panel-wrapper';
        
        // Wrap the control panel
        controlPanel.parentNode.insertBefore(panelWrapper, controlPanel);
        panelWrapper.appendChild(toggleButton);
        panelWrapper.appendChild(controlPanel);
        
        // Add mobile-specific classes
        controlPanel.classList.add('mobile-collapsible');
        
        // Set initial state (collapsed by default on mobile)
        this.controlPanelExpanded = false;
        this.toggleMobileControlPanel(false, false); // false = collapsed, false = no animation
        
        // Add event listener
        toggleButton.addEventListener('click', () => {
            this.toggleMobileControlPanel(!this.controlPanelExpanded, true);
        });
        
        // Add styles for mobile control panel
        this.addMobileControlPanelStyles();
    }
    
    toggleMobileControlPanel(expand, animate = true) {
        const controlPanel = document.getElementById('control-panel');
        const toggleButton = document.getElementById('mobile-panel-toggle');
        const toggleIcon = toggleButton?.querySelector('.toggle-icon');
        
        if (!controlPanel || !toggleButton) return;
        
        this.controlPanelExpanded = expand;
        
        // Update button state
        toggleButton.setAttribute('aria-expanded', expand.toString());
        if (toggleIcon) {
            toggleIcon.textContent = expand ? '▲' : '▼';
        }
        
        // Apply transition class if animating
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
        
        // Remove transition class after animation
        if (animate) {
            setTimeout(() => {
                controlPanel.classList.remove('transitioning');
            }, 300);
        }
        
        // Notify app about layout change
        setTimeout(() => {
            if (this.app.mapManager && this.app.mapManager.map) {
                this.app.mapManager.map.invalidateSize();
            }
        }, animate ? 300 : 0);
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
            
            /* Ensure map takes full space when panel is collapsed */
            .mobile-panel-wrapper:has(.mobile-collapsible.collapsed) + #map-container {
                height: calc(100vh - 48px) !important;
            }
            
            /* Desktop and tablet - hide toggle button */
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
        // Tablet-specific layout adjustments
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
        // Desktop-specific layout adjustments
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
                // Landscape mobile optimizations
                if (controlPanel) {
                    controlPanel.style.maxHeight = '120px';
                }
            } else {
                // Portrait mobile optimizations
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
            // Mobile map optimizations
            map.options.zoomControl = false;
            
            // Add mobile-friendly zoom controls
            this.addMobileZoomControls(map);
            
            // Reduce animation duration for performance
            map.options.fadeAnimation = false;
            map.options.zoomAnimation = this.performanceLevel !== 'low';
            
        } else if (this.isTablet()) {
            // Tablet optimizations
            map.options.zoomAnimation = true;
            map.options.fadeAnimation = this.performanceLevel === 'high';
            
        } else {
            // Desktop optimizations
            map.options.zoomAnimation = true;
            map.options.fadeAnimation = true;
        }
    }
    
    optimizeMapControlsForMobile() {
        // Simplify map controls for mobile devices
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.style.touchAction = 'pan-x pan-y';
        }
    }
    
    addMobileZoomControls(map) {
        // Add custom mobile-friendly zoom controls
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
    
    // Interaction optimizations
    adjustInteractionMethods() {
        if (this.touchSupport) {
            this.optimizeForTouch();
        } else {
            this.optimizeForMouse();
        }
    }
    
    optimizeForTouch() {
        // Add touch-specific optimizations
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
        // Add mouse-specific optimizations
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
    
    // Performance optimizations
    optimizeDataLoading() {
        if (this.performanceLevel === 'low' || this.isSlowConnection()) {
            // Reduce data quality for low-performance devices
            this.enableLowPerformanceMode();
        } else if (this.performanceLevel === 'high') {
            this.enableHighPerformanceMode();
        }
    }
    
    enableLowPerformanceMode() {
        console.log('Enabling low performance mode');
        
        // Reduce heatmap resolution
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.gridResolution = 4; // Lower resolution
        }
        
        // Limit number of cyclones displayed
        this.maxCyclonesToDisplay = 50;
        
        // Disable animations
        this.disableAnimations();
    }
    
    enableHighPerformanceMode() {
        console.log('Enabling high performance mode');
        
        // Use higher resolution heatmaps
        if (this.app.visualizationRenderer) {
            this.app.visualizationRenderer.gridResolution = 1; // Higher resolution
        }
        
        // Allow more cyclones
        this.maxCyclonesToDisplay = 500;
        
        // Enable enhanced animations
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
    
    // Check if this is first visit for user guidance
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