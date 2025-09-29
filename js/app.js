class TCVisualization {
    constructor() {
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
        
        this.mapManager = new MapManager(this);
        this.dataManager = new DataManager(this);
        this.visualizationRenderer = new VisualizationRenderer(this);
        this.uiController = new UIController(this);
        this.deviceManager = new DeviceManager(this);
        this.utils = new TCUtils();
        this.tutorialManager = new TutorialManager(this);

        this.init();
    }
    
    async init() {
        try {
            await this.mapManager.initializeMap();
            this.uiController.initializeEventListeners();
            this.uiController.updateEnsembleSelector();
            this.uiController.updateYearSlider();
            await this.dataManager.loadData();
            this.visualizationRenderer.createComparisonPanel();

            // Initialize tutorial after everything is loaded
            await this.tutorialManager.checkAndStartTutorial();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.utils.showNotification('Failed to initialize application', 'error');
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
        
        console.log(`Comparison: ${cyclonesA.length} vs ${cyclonesB.length} cyclones`);
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
        console.log(`Showing ${cyclones.length} cyclones in ${displayMode} mode`);
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
            alert('No data to export');
            return;
        }
        
        this.utils.exportToCSV(data, this.currentScenario, this.currentEnsemble, this.currentSSTModel, this.yearRange);
    }
    
    exportComparisonData() {
        const dataA = this.dataManager.getComparisonData('A');
        const dataB = this.dataManager.getComparisonData('B');
        
        if (!dataA?.cyclones || !dataB?.cyclones) {
            alert('No comparison data to export');
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