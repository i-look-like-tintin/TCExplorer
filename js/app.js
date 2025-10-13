class TCVisualization {
    constructor() {
        // Data source - always default to 'simulated' on page load
        this.dataSource = 'simulated';
        this.currentRegion = this.loadRegion();  // Region selector for real data

        this.currentScenario = 'current';
        this.currentEnsemble = 1;
        this.currentSSTModel = 'CC';
        this.cycloneData = {};
        this.selectedCyclone = null;
        this.yearRange = null;
        this.scenarioYearRanges = {
            'current': { min: 1951, max: 2011 },
            'nat': { min: 1951, max: 2010 },
            '2k': { min: 2031, max: 2090 },
            '4k': { min: 2051, max: 2110 }
        };

        // Real data has its own year range (approximately 1842 to present)
        this.realDataYearRange = {
            min: 1842,
            max: new Date().getFullYear()
        };
        
        // Comparison mode properties
        this.comparisonMode = false;
        this.comparisonScenarioA = 'current';
        this.comparisonEnsembleA = 1;
        this.comparisonSSTModelA = 'CC';
        this.comparisonScenarioB = '2k';
        this.comparisonEnsembleB = 1;
        this.comparisonSSTModelB = 'CC';

        // Separate year ranges for comparison scenarios
        this.comparisonYearRangeA = null;
        this.comparisonYearRangeB = null;

        // Visibility toggles for scenarios
        this.scenarioAVisible = true;
        this.scenarioBVisible = true;
        
        this.showHeatmap = false;
        this.heatmapRequestId = 0;

        // Colorblind mode
        this.colorBlindMode = this.loadColorBlindMode();

        this.mapManager = new MapManager(this);
        this.dataManager = new DataManager(this);
        this.visualizationRenderer = new VisualizationRenderer(this);
        this.uiController = new UIController(this);
        this.deviceManager = new DeviceManager(this);
        this.utils = new TCUtils();
        this.tutorialManager = new TutorialManager(this);

        this.init();
    }

    loadColorBlindMode() {
        try {
            const saved = localStorage.getItem('tcColorBlindMode');
            return saved === 'true';
        } catch (error) {
            console.warn('Failed to load colorblind mode from localStorage:', error);
            return false;
        }
    }

    saveColorBlindMode(enabled) {
        try {
            localStorage.setItem('tcColorBlindMode', enabled.toString());
        } catch (error) {
            console.warn('Failed to save colorblind mode to localStorage:', error);
        }
    }

    loadDataSource() {
        try {
            const saved = localStorage.getItem('tcDataSource');
            return (saved === 'real') ? 'real' : 'simulated';
        } catch (error) {
            console.warn('Failed to load data source from localStorage:', error);
            return 'simulated';
        }
    }

    saveDataSource(source) {
        try {
            localStorage.setItem('tcDataSource', source);
        } catch (error) {
            console.warn('Failed to save data source to localStorage:', error);
        }
    }

    loadRegion() {
        try {
            const saved = localStorage.getItem('tcRegion');
            return saved || 'australian';
        } catch (error) {
            console.warn('Failed to load region from localStorage:', error);
            return 'australian';
        }
    }

    saveRegion(region) {
        try {
            localStorage.setItem('tcRegion', region);
        } catch (error) {
            console.warn('Failed to save region to localStorage:', error);
        }
    }

    async changeDataSource(newSource) {
        if (this.dataSource === newSource) return;

        const previousSource = this.dataSource;
        this.dataSource = newSource;
        this.saveDataSource(newSource);

        // Clear cached data when switching sources
        this.cycloneData = {};
        this.selectedCyclone = null;

        // Update UI based on data source
        if (newSource === 'real') {
            // Disable features not available for real data
            this.comparisonMode = false;
            this.uiController.updateDataSourceUI(newSource);

            // Update year range to real data range
            this.yearRange = null; // Will use full real data range

            // Show info message
            this.utils.showNotification(
                'Switched to Real Historical Data. Some features disabled (scenarios, ensembles, comparisons).',
                'info'
            );
        } else {
            // Re-enable simulated data features
            this.uiController.updateDataSourceUI(newSource);
            this.yearRange = null;

            this.utils.showNotification(
                'Switched to Simulated Climate Model Data. All features enabled.',
                'success'
            );
        }

        // Load new data
        await this.dataManager.loadData();
    }

    async changeRegion(newRegion) {
        // Region changes only apply to real data mode
        if (this.dataSource !== 'real') return;
        if (this.currentRegion === newRegion) return;

        this.currentRegion = newRegion;
        this.saveRegion(newRegion);

        // Clear cached data for the old region
        this.cycloneData = {};
        this.selectedCyclone = null;
        this.yearRange = null;

        // Get region config for map view
        const regionConfig = TCConfigUtils.getRegion(newRegion);
        if (regionConfig && regionConfig.defaultCenter && regionConfig.defaultZoom) {
            this.mapManager.map.setView(regionConfig.defaultCenter, regionConfig.defaultZoom);
        }

        // Load new data for the selected region
        await this.dataManager.loadData();

        // Show notification
        const regionName = regionConfig ? regionConfig.name : newRegion;
        this.utils.showNotification(
            `Switched to ${regionName}. Loading cyclone data...`,
            'info'
        );
    }

    async init() {
        try {
            // Apply iOS fixes before map initialization
            this.applyIOSGlobalFixes();

            // Reset display options to defaults on every page load
            this.resetDisplayOptionsToDefaults();

            await this.mapManager.initializeMap();
            this.uiController.initializeEventListeners();
            this.uiController.updateEnsembleSelector();
            this.uiController.updateYearSlider();

            // Initialize colorblind mode checkbox
            const colorblindCheckbox = document.getElementById('colorblind-mode');
            if (colorblindCheckbox) {
                colorblindCheckbox.checked = this.colorBlindMode;
            }

            await this.dataManager.loadData();
            this.visualizationRenderer.createComparisonPanel();

            // Initialize tutorial after everything is loaded
            await this.tutorialManager.checkAndStartTutorial();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.utils.showNotification('Failed to initialize application', 'error');
        }
    }

    resetDisplayOptionsToDefaults() {
        // Reset display checkboxes to defaults (tracks and genesis only)
        const showTracksCheckbox = document.getElementById('show-tracks');
        const showGenesisCheckbox = document.getElementById('show-genesis');
        const showHeatmapCheckbox = document.getElementById('show-heatmap');
        const showIntensityCheckbox = document.getElementById('show-intensity');
        const showPreCat1Checkbox = document.getElementById('show-pre-cat1');

        if (showTracksCheckbox) showTracksCheckbox.checked = true;
        if (showGenesisCheckbox) showGenesisCheckbox.checked = true;
        if (showHeatmapCheckbox) showHeatmapCheckbox.checked = false;
        if (showIntensityCheckbox) showIntensityCheckbox.checked = false;
        if (showPreCat1Checkbox) showPreCat1Checkbox.checked = false;

        // Reset data source selector to simulated
        const dataSourceSelect = document.getElementById('data-source-select');
        if (dataSourceSelect) {
            dataSourceSelect.value = 'simulated';
        }
    }

    applyIOSGlobalFixes() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        if (isIOS || isSafari) {
            // Prevent zoom on iOS
            document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
            });

            // Handle iOS viewport changes
            const setVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };

            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', () => {
                setTimeout(setVH, 500);
            });

            // Force reflow for iOS Safari
            setTimeout(() => {
                document.body.style.height = '100vh';
                document.body.style.height = '100%';
            }, 100);
        }
    }
    
    async toggleComparisonMode(enabled) {
        this.comparisonMode = enabled;
        
        if (enabled) {
            this.showHeatmap = false;
            this.showDensityHeatmap = false;
            this.uiController.updateComparisonUI(true);
            this.uiController.disableHeatmapControls();
            await this.loadComparisonData();
        } else {
            this.uiController.updateComparisonUI(false);
            this.uiController.enableHeatmapControls();
            await this.dataManager.loadData();
        }
    }
    
    async loadComparisonData() {
        this.showLoading(true, 'Loading comparison data...');
        
        try {
            await this.dataManager.loadComparisonData(
                this.comparisonScenarioA, 
                this.comparisonEnsembleA, 
                this.comparisonSSTModelA,
                this.comparisonScenarioB, 
                this.comparisonEnsembleB, 
                this.comparisonSSTModelB
            );
            
            await this.updateVisualization();
        } catch (error) {
            console.error('Failed to load comparison data:', error);
            this.utils.showNotification('Failed to load comparison data', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async changeComparisonScenario(scenarioType, newScenario) {
        if (scenarioType === 'A') {
            if (this.comparisonScenarioA === newScenario) return;
            this.comparisonScenarioA = newScenario;
        } else {
            if (this.comparisonScenarioB === newScenario) return;
            this.comparisonScenarioB = newScenario;
        }

        this.uiController.updateComparisonEnsembleSelectors();
        this.uiController.updateComparisonYearSliders();
        await this.loadComparisonData();
    }
    
    async changeComparisonEnsemble(scenarioType, newEnsemble) {
        if (scenarioType === 'A') {
            if (this.comparisonEnsembleA === newEnsemble) return;
            this.comparisonEnsembleA = newEnsemble;
        } else {
            if (this.comparisonEnsembleB === newEnsemble) return;
            this.comparisonEnsembleB = newEnsemble;
        }
        
        await this.loadComparisonData();
    }
    
    async changeComparisonSST(scenarioType, newSST) {
        if (scenarioType === 'A') {
            if (this.comparisonSSTModelA === newSST) return;
            this.comparisonSSTModelA = newSST;
        } else {
            if (this.comparisonSSTModelB === newSST) return;
            this.comparisonSSTModelB = newSST;
        }
        
        await this.loadComparisonData();
    }
    
    async changeScenario(newScenario) {
        if (this.comparisonMode) return;
        if (this.currentScenario === newScenario) return;
        
        this.currentScenario = newScenario;
        this.uiController.updateEnsembleSelector();
        this.uiController.updateYearSlider();
        await this.dataManager.loadData();
    }
    
    async changeEnsemble(newEnsemble) {
        if (this.comparisonMode) return;
        if (this.currentEnsemble === newEnsemble) return;
        
        this.currentEnsemble = newEnsemble;
        await this.dataManager.loadData();
    }
    
    async changeSST(newSST) {
        if (this.comparisonMode) return;
        if (this.currentSSTModel === newSST) return;

        this.currentSSTModel = newSST;
        await this.dataManager.loadData();
    }

    async toggleColorBlindMode(enabled) {
        this.colorBlindMode = enabled;
        this.saveColorBlindMode(enabled);

        // Update comparison colors
        this.visualizationRenderer.updateComparisonColors();

        // Update the legend
        if (this.comparisonMode) {
            this.visualizationRenderer.updateComparisonLegend(
                this.comparisonScenarioA,
                this.comparisonScenarioB
            );
        } else {
            this.visualizationRenderer.updateStandardLegend();
        }

        // Refresh the visualization to apply new colors
        await this.updateVisualization();

        // Show notification
        const message = enabled ?
            'Colorblind mode enabled - using accessible color palette' :
            'Colorblind mode disabled - using standard color palette';
        this.utils.showNotification(message, 'success');
    }

    async toggleVisualizationMode(mode, enabled) {
        if (this.comparisonMode && mode === 'heatmap') {
            this.utils.showNotification('Heatmap mode not available in comparison mode', 'info');
            return;
        }
        
        if (mode === 'heatmap') {
            this.showHeatmap = enabled;
            if (enabled) {
                this.uiController.disableYearControls('Severity Mode');
            } else {
                this.uiController.enableYearControls();
            }
        }
        
        await this.updateVisualization();
    }
    
    async updateVisualization() {
        if (this.comparisonMode) {
            await this.updateComparisonVisualization();
        } else {
            await this.updateSingleVisualization();
        }
    }
    
    async updateComparisonVisualization() {
        const dataA = this.dataManager.getComparisonData('A');
        const dataB = this.dataManager.getComparisonData('B');

        if (!dataA?.cyclones || !dataB?.cyclones) return;

        this.visualizationRenderer.clearAllLayers();

        const showPreCat1 = document.getElementById('show-pre-cat1')?.checked || false;
        let cyclonesA = this.dataManager.filterTrackFromCategory1(dataA.cyclones, showPreCat1);
        let cyclonesB = this.dataManager.filterTrackFromCategory1(dataB.cyclones, showPreCat1);
        
        // Apply separate year ranges for each scenario
        if (this.comparisonYearRangeA) {
            cyclonesA = cyclonesA.filter(c =>
                c.year >= this.comparisonYearRangeA.min && c.year <= this.comparisonYearRangeA.max
            );
        } else {
            // Use full range if not set
            const boundsA = this.scenarioYearRanges[this.comparisonScenarioA];
            this.comparisonYearRangeA = { min: boundsA.min, max: boundsA.max };
        }

        if (this.comparisonYearRangeB) {
            cyclonesB = cyclonesB.filter(c =>
                c.year >= this.comparisonYearRangeB.min && c.year <= this.comparisonYearRangeB.max
            );
        } else {
            // Use full range if not set
            const boundsB = this.scenarioYearRanges[this.comparisonScenarioB];
            this.comparisonYearRangeB = { min: boundsB.min, max: boundsB.max };
        }

        // Apply visibility toggles - set to empty array if not visible
        if (!this.scenarioAVisible) {
            cyclonesA = [];
        }
        if (!this.scenarioBVisible) {
            cyclonesB = [];
        }
        
        await this.visualizationRenderer.renderComparisonVisualization(
            cyclonesA, 
            cyclonesB,
            this.comparisonScenarioA,
            this.comparisonScenarioB
        );
        
    }
    
    async updateSingleVisualization() {
        const cacheKey = this.dataManager.getCacheKey();
        const data = this.cycloneData[cacheKey];

        if (!data || !data.cyclones) return;

        this.visualizationRenderer.clearAllLayers();

        const showPreCat1 = document.getElementById('show-pre-cat1')?.checked || false;
        let cyclones = this.dataManager.filterTrackFromCategory1(data.cyclones, showPreCat1);
        if (this.yearRange) {
            cyclones = cyclones.filter(c => 
                c.year >= this.yearRange.min && c.year <= this.yearRange.max
            );
        }
        
        if (this.showHeatmap) {
            await this.visualizationRenderer.createHeatmap(cyclones);
        } else {
            await this.visualizationRenderer.renderStandardVisualization(cyclones);
        }
        
        const displayMode = this.showHeatmap ? 'severity heatmap' : 'tracks';
    }
    
    updateYearRange(min, max) {
        if (this.comparisonMode) {
            this.yearRange = { min, max };
            this.updateVisualization();
            return;
        }
        
        const bounds = this.scenarioYearRanges[this.currentScenario];
        
        if (min === bounds.min && max === bounds.max) {
            this.yearRange = null;
        } else {
            this.yearRange = { min, max };
        }
        
        this.updateVisualization();
    }
    
    selectCyclone(cyclone) {
        this.selectedCyclone = cyclone;
        this.uiController.showCycloneInfo(cyclone);
    }
    
    exportData() {
        if (this.comparisonMode) {
            this.exportComparisonData();
        } else {
            this.exportSingleData();
        }
    }
    
    exportSingleData() {
        const cacheKey = this.dataManager.getCacheKey();
        const data = this.cycloneData[cacheKey];
        
        if (!data || !data.cyclones) {
            this.utils.showNotification('No data available to export', 'warning');
            return;
        }
        
        this.utils.exportToCSV(data, this.currentScenario, this.currentEnsemble, this.currentSSTModel, this.yearRange);
    }
    
    exportComparisonData() {
        const dataA = this.dataManager.getComparisonData('A');
        const dataB = this.dataManager.getComparisonData('B');
        
        if (!dataA?.cyclones || !dataB?.cyclones) {
            this.utils.showNotification('No comparison data available to export', 'warning');
            return;
        }
        
        this.utils.exportComparisonToCSV(
            dataA, dataB,
            this.comparisonScenarioA, this.comparisonScenarioB,
            this.comparisonEnsembleA, this.comparisonEnsembleB,
            this.comparisonSSTModelA, this.comparisonSSTModelB,
            this.yearRange
        );
    }
    
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
    
    getState() {
        return {
            dataSource: this.dataSource,
            scenario: this.currentScenario,
            ensemble: this.currentEnsemble,
            sstModel: this.currentSSTModel,
            yearRange: this.yearRange,
            comparisonMode: this.comparisonMode,
            comparisonScenarios: {
                A: {
                    scenario: this.comparisonScenarioA,
                    ensemble: this.comparisonEnsembleA,
                    sstModel: this.comparisonSSTModelA
                },
                B: {
                    scenario: this.comparisonScenarioB,
                    ensemble: this.comparisonEnsembleB,
                    sstModel: this.comparisonSSTModelB
                }
            },
            visualizationModes: {
                heatmap: this.showHeatmap
            },
            dataLoaded: Object.keys(this.cycloneData).length > 0,
            deviceInfo: this.deviceManager ? this.deviceManager.getDeviceInfo() : null,
            mobileControlsExpanded: this.deviceManager ? this.deviceManager.controlPanelExpanded : null
        };
    }
    
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
    
    forceLayoutRefresh() {
        if (this.deviceManager) {
            this.deviceManager.forceLayoutRefresh();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tcApp = new TCVisualization();
});