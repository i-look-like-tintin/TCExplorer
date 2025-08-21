/**
 * Main Application Coordinator
 * Manages the overall application state and coordinates between modules
 */
class TCVisualization {
    constructor() {
        // Core application state
        this.currentScenario = 'current';
        this.currentEnsemble = 1;
        this.currentSSTModel = 'CC';
        this.cycloneData = {};
        this.selectedCyclone = null;
        this.filterAustralia = true;
        this.yearRange = null;
        this.scenarioYearRanges = {
            'current': { min: 1951, max: 2011 },
            '2k': { min: 2031, max: 2090 },
            '4k': { min: 2051, max: 2110 }
        };
        
        // Visualization state
        this.showHeatmap = false;
        this.showDensityHeatmap = false;
        this.heatmapRequestId = 0;
        
        // Initialize modules
        this.mapManager = new MapManager(this);
        this.dataManager = new DataManager(this);
        this.visualizationRenderer = new VisualizationRenderer(this);
        this.uiController = new UIController(this);
        this.deviceManager = new DeviceManager(this);
        this.utils = new TCUtils();
        
        this.init();
    }
    
    async init() {
        try {
            await this.mapManager.initializeMap();
            this.uiController.initializeEventListeners();
            this.uiController.updateEnsembleSelector();
            this.uiController.updateYearSlider();
            // Device manager initializes automatically in constructor
            await this.dataManager.loadData();
            this.visualizationRenderer.createComparisonPanel();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.utils.showNotification('Failed to initialize application', 'error');
        }
    }
    
    // Scenario management
    async changeScenario(newScenario) {
        if (this.currentScenario === newScenario) return;
        
        this.currentScenario = newScenario;
        this.uiController.updateEnsembleSelector();
        this.uiController.updateYearSlider();
        await this.dataManager.loadData();
    }
    
    // Ensemble management
    async changeEnsemble(newEnsemble) {
        if (this.currentEnsemble === newEnsemble) return;
        
        this.currentEnsemble = newEnsemble;
        await this.dataManager.loadData();
    }
    
    // SST Model management
    async changeSST(newSST) {
        if (this.currentSSTModel === newSST) return;
        
        this.currentSSTModel = newSST;
        await this.dataManager.loadData();
    }
    
    // Visualization mode management
    async toggleVisualizationMode(mode, enabled) {
        switch (mode) {
            case 'heatmap':
                this.showHeatmap = enabled;
                if (enabled) {
                    this.showDensityHeatmap = false;
                    this.uiController.disableYearControls('Severity Mode');
                } else {
                    this.uiController.enableYearControls();
                }
                break;
                
            case 'density':
                this.showDensityHeatmap = enabled;
                if (enabled) {
                    this.showHeatmap = false;
                    this.uiController.disableYearControls('Density Mode');
                } else {
                    this.uiController.enableYearControls();
                }
                break;
        }
        
        await this.updateVisualization();
    }
    
    // Main visualization update
    async updateVisualization() {
        const cacheKey = this.dataManager.getCacheKey();
        const data = this.cycloneData[cacheKey];
        
        if (!data || !data.cyclones) return;
        
        // Clear existing visualizations
        this.visualizationRenderer.clearAllLayers();
        
        // Filter cyclones by year range if applicable
        let cyclones = data.cyclones;
        if (!this.showDensityHeatmap && this.yearRange) {
            cyclones = cyclones.filter(c => 
                c.year >= this.yearRange.min && c.year <= this.yearRange.max
            );
        }
        
        // Render based on current mode
        if (this.showDensityHeatmap) {
            await this.visualizationRenderer.createDensityHeatmap(cyclones);
        } else if (this.showHeatmap) {
            await this.visualizationRenderer.createHeatmap(cyclones);
        } else {
            await this.visualizationRenderer.renderStandardVisualization(cyclones);
        }
        
        const displayMode = this.showDensityHeatmap ? 'density heatmap' : 
                           (this.showHeatmap ? 'severity heatmap' : 'tracks');
        console.log(`Showing ${cyclones.length} cyclones in ${displayMode} mode`);
    }
    
    // Year range management
    updateYearRange(min, max) {
        const bounds = this.scenarioYearRanges[this.currentScenario];
        
        if (min === bounds.min && max === bounds.max) {
            this.yearRange = null;
        } else {
            this.yearRange = { min, max };
        }
        
        this.updateVisualization();
    }
    
    // Cyclone selection
    selectCyclone(cyclone) {
        this.selectedCyclone = cyclone;
        this.uiController.showCycloneInfo(cyclone);
    }
    
    // Data export
    exportData() {
        const cacheKey = this.dataManager.getCacheKey();
        const data = this.cycloneData[cacheKey];
        
        if (!data || !data.cyclones) {
            alert('No data to export');
            return;
        }
        
        this.utils.exportToCSV(data, this.currentScenario, this.currentEnsemble, this.currentSSTModel, this.yearRange);
    }
    
    // Loading state management
    showLoading(show, message = 'Loading cyclone data...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = overlay.querySelector('p');
        
        if (show) {
            if (loadingText) loadingText.textContent = message;
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    // Get current state for debugging/monitoring
    getState() {
        return {
            scenario: this.currentScenario,
            ensemble: this.currentEnsemble,
            sstModel: this.currentSSTModel,
            yearRange: this.yearRange,
            visualizationModes: {
                heatmap: this.showHeatmap,
                density: this.showDensityHeatmap
            },
            dataLoaded: Object.keys(this.cycloneData).length > 0,
            deviceInfo: this.deviceManager ? this.deviceManager.getDeviceInfo() : null,
            mobileControlsExpanded: this.deviceManager ? this.deviceManager.controlPanelExpanded : null
        };
    }
    
    // Mobile control panel methods
    showMobileControls() {
        if (this.deviceManager) {
            this.deviceManager.showMobileControls();
        }
    }
    
    hideMobileControls() {
        if (this.deviceManager) {
            this.deviceManager.hideMobileControls();
        }
    }
    
    toggleMobileControls() {
        if (this.deviceManager) {
            if (this.deviceManager.controlPanelExpanded) {
                this.deviceManager.hideMobileControls();
            } else {
                this.deviceManager.showMobileControls();
            }
        }
    }
    
    // Debug method to force layout refresh
    forceLayoutRefresh() {
        if (this.deviceManager) {
            this.deviceManager.forceLayoutRefresh();
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tcApp = new TCVisualization();
});