/**
 * UI Controller
 * Handles user interface interactions, event listeners, and control updates
 */
class UIController {
    constructor(app) {
        this.app = app;
        this.lastChangedSlider = null;
    }
    
    // Initialize all event listeners
    initializeEventListeners() {
        this.setupScenarioButtons();
        this.setupEnsembleControls();
        this.setupVisualizationToggles();
        this.setupYearRangeControls();
        this.setupActionButtons();
        this.setupFilterControls();
        
        console.log('Event listeners initialized');
    }
    
    // Scenario button handlers
    setupScenarioButtons() {
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.handleScenarioChange(e);
            });
        });
    }
    
    async handleScenarioChange(e) {
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        const newScenario = e.target.dataset.scenario;
        await this.app.changeScenario(newScenario);
    }
    
    // Ensemble and SST controls
    setupEnsembleControls() {
        document.getElementById('ensemble-select').addEventListener('change', async (e) => {
            const newEnsemble = parseInt(e.target.value);
            await this.app.changeEnsemble(newEnsemble);
        });
        
        document.getElementById('sst-select').addEventListener('change', async (e) => {
            const newSST = e.target.value;
            await this.app.changeSST(newSST);
        });
    }
    
    // Visualization toggle controls
    setupVisualizationToggles() {
        document.getElementById('show-heatmap').addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            if (enabled) {
                // Disable other modes
                document.getElementById('show-density-heatmap').checked = false;
                this.setTrackDisplays(false);
                this.app.mapManager.saveMapState();
            }
            await this.app.toggleVisualizationMode('heatmap', enabled);
        });
        
        document.getElementById('show-density-heatmap').addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            if (enabled) {
                // Disable other modes
                document.getElementById('show-heatmap').checked = false;
                this.setTrackDisplays(false);
                this.app.mapManager.saveMapState();
            }
            await this.app.toggleVisualizationMode('density', enabled);
        });
        
        // Track display toggles
        ['show-tracks', 'show-genesis', 'show-intensity'].forEach(id => {
            document.getElementById(id).addEventListener('change', async (e) => {
                if (e.target.checked && (this.app.showHeatmap || this.app.showDensityHeatmap)) {
                    // Disable heatmap modes when switching to track displays
                    document.getElementById('show-heatmap').checked = false;
                    document.getElementById('show-density-heatmap').checked = false;
                    this.app.showHeatmap = false;
                    this.app.showDensityHeatmap = false;
                    this.enableYearControls();
                }
                
                const layerName = id.replace('show-', '');
                this.app.mapManager.toggleLayer(layerName, e.target.checked);
                await this.app.updateVisualization();
            });
        });
    }
    
    // Year range controls
    setupYearRangeControls() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        
        yearMinSlider.addEventListener('input', (e) => {
            this.lastChangedSlider = 'min';
            this.updateYearRange();
        });
        
        yearMaxSlider.addEventListener('input', (e) => {
            this.lastChangedSlider = 'max';
            this.updateYearRange();
        });
        
        this.updateSliderRange();
    }
    
    updateYearRange() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        if (yearMinSlider.disabled) return;
        
        let min = parseInt(yearMinSlider.value);
        let max = parseInt(yearMaxSlider.value);
        
        const bounds = this.app.scenarioYearRanges[this.app.currentScenario];
        
        // Ensure values are within bounds
        min = Math.max(bounds.min, Math.min(bounds.max, min));
        max = Math.max(bounds.min, Math.min(bounds.max, max));
        
        // Handle slider collision
        if (min > max) {
            if (this.lastChangedSlider === 'min') {
                max = min;
                yearMaxSlider.value = max;
            } else {
                min = max;
                yearMinSlider.value = min;
            }
        }
        
        yearMinSlider.value = min;
        yearMaxSlider.value = max;
        
        this.updateSliderRange();
        this.updateYearDisplay();
        
        // Update app state
        this.app.updateYearRange(min, max);
    }
    
    updateSliderRange() {
        const minSlider = document.getElementById('year-slider-min');
        const maxSlider = document.getElementById('year-slider-max');
        const sliderRange = document.querySelector('.slider-range');
        
        if (!sliderRange) return;
        
        const min = parseInt(minSlider.value);
        const max = parseInt(maxSlider.value);
        const sliderMin = parseInt(minSlider.min);
        const sliderMax = parseInt(minSlider.max);
        
        const minPercent = ((min - sliderMin) / (sliderMax - sliderMin)) * 100;
        const maxPercent = ((max - sliderMin) / (sliderMax - sliderMin)) * 100;
        
        sliderRange.style.left = `${minPercent}%`;
        sliderRange.style.width = `${maxPercent - minPercent}%`;
    }
    
    // Action buttons
    setupActionButtons() {
        document.getElementById('export-data').addEventListener('click', () => {
            this.app.exportData();
        });
        
        document.getElementById('refresh-data').addEventListener('click', async () => {
            await this.app.dataManager.loadData(true);
        });
    }
    
    // Filter controls
    setupFilterControls() {
        document.getElementById('filter-australia').addEventListener('change', async (e) => {
            this.app.filterAustralia = e.target.checked;
            await this.app.dataManager.loadData();
        });
    }
    
    // UI update methods
    updateEnsembleSelector() {
        const ensembleInfo = document.getElementById('ensemble-info');
        const ensembleSelect = document.getElementById('ensemble-select');
        const sstSelector = document.getElementById('sst-selector');
        
        const ensembleLimits = {
            'current': { max: 100, available: 100, note: '(1-100 available)' },
            '2k': { max: 9, available: 9, note: '(101-109 on server)' },
            '4k': { max: 15, available: 15, note: '(101-115 on server)' }
        };
        
        const limit = ensembleLimits[this.app.currentScenario];
        
        ensembleInfo.textContent = limit.note;
        
        // Show/hide SST selector
        if (this.app.currentScenario === '2k' || this.app.currentScenario === '4k') {
            sstSelector.style.display = 'flex';
        } else {
            sstSelector.style.display = 'none';
        }
        
        // Update ensemble options
        const currentValue = parseInt(ensembleSelect.value);
        ensembleSelect.innerHTML = '';
        
        for (let i = 1; i <= Math.min(limit.max, 15); i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Ensemble ${i}`;
            ensembleSelect.appendChild(option);
        }
        
        if (currentValue <= limit.max) {
            ensembleSelect.value = currentValue;
        } else {
            ensembleSelect.value = 1;
            this.app.currentEnsemble = 1;
        }
    }
    
    updateYearSlider() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        
        const bounds = this.app.scenarioYearRanges[this.app.currentScenario];
        
        yearMinSlider.min = bounds.min;
        yearMinSlider.max = bounds.max;
        yearMinSlider.value = bounds.min;
        
        yearMaxSlider.min = bounds.min;
        yearMaxSlider.max = bounds.max;
        yearMaxSlider.value = bounds.max;
        
        this.app.yearRange = null;
        this.updateSliderRange();
        this.updateYearDisplay();
    }
    
    updateYearDisplay() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        if (this.app.showDensityHeatmap) {
            yearDisplay.textContent = 'All Years (Density Mode)';
        } else if (this.app.showHeatmap) {
            yearDisplay.textContent = 'All Years (Severity Mode)';
        } else {
            const bounds = this.app.scenarioYearRanges[this.app.currentScenario];
            const min = parseInt(yearMinSlider.value);
            const max = parseInt(yearMaxSlider.value);
            
            if (min === bounds.min && max === bounds.max) {
                yearDisplay.textContent = `${bounds.min} - ${bounds.max}`;
            } else if (min === max) {
                yearDisplay.textContent = `Year: ${min}`;
            } else {
                yearDisplay.textContent = `${min} - ${max}`;
            }
        }
    }
    
    // Year control state management
    disableYearControls(mode) {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        const bounds = this.app.scenarioYearRanges[this.app.currentScenario];
        
        yearMinSlider.disabled = true;
        yearMaxSlider.disabled = true;
        yearMinSlider.value = bounds.min;
        yearMaxSlider.value = bounds.max;
        yearDisplay.textContent = `All Years (${mode})`;
        yearDisplay.classList.add('disabled');
        this.app.yearRange = null;
        this.updateSliderRange();
    }
    
    enableYearControls() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        yearMinSlider.disabled = false;
        yearMaxSlider.disabled = false;
        yearDisplay.classList.remove('disabled');
        this.updateYearDisplay();
    }
    
    // Helper methods
    setTrackDisplays(enabled) {
        document.getElementById('show-tracks').checked = enabled;
        document.getElementById('show-genesis').checked = enabled;
        document.getElementById('show-intensity').checked = enabled;
        
        if (!enabled) {
            this.app.mapManager.toggleLayer('tracks', false);
            this.app.mapManager.toggleLayer('genesis', false);
            this.app.mapManager.toggleLayer('intensity', false);
        }
    }
    
    // Cyclone information display
    showCycloneInfo(cyclone) {
        const infoPanel = document.getElementById('info-panel');
        const details = document.getElementById('cyclone-details');
        
        if (!infoPanel || !details) return;
        
        details.innerHTML = `
            <p><strong>ID:</strong> ${cyclone.id}</p>
            <p><strong>Name:</strong> ${cyclone.name}</p>
            <p><strong>Year:</strong> ${cyclone.year}</p>
            <p><strong>Max Category:</strong> ${cyclone.maxCategory}</p>
            <p><strong>Max Wind Speed:</strong> ${cyclone.maxWind} km/h</p>
            <p><strong>Min Pressure:</strong> ${cyclone.minPressure} hPa</p>
            <p><strong>Duration:</strong> ${cyclone.duration_days || cyclone.duration} days</p>
            <p><strong>Genesis:</strong> ${cyclone.genesis_lat.toFixed(2)}°, ${cyclone.genesis_lon.toFixed(2)}°</p>
            <p><strong>Landfall:</strong> ${cyclone.landfall ? 'Yes' : 'No'}</p>
        `;
        
        infoPanel.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            infoPanel.classList.add('hidden');
        }, 10000);
    }
    
    // Form validation and user feedback
    validateInput(value, min, max, fieldName) {
        if (isNaN(value) || value < min || value > max) {
            this.showValidationError(`${fieldName} must be between ${min} and ${max}`);
            return false;
        }
        return true;
    }
    
    showValidationError(message) {
        const errorEl = document.getElementById('validation-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 3000);
        } else {
            // Fallback to notification system
            this.app.utils.showNotification(message, 'error');
        }
    }
    
    // Control state management
    enableControls() {
        const controls = document.querySelectorAll('button, select, input');
        controls.forEach(control => {
            control.disabled = false;
        });
    }
    
    disableControls() {
        const controls = document.querySelectorAll('button:not(.always-enabled), select, input');
        controls.forEach(control => {
            control.disabled = true;
        });
    }
    
    // Responsive layout adjustments
    adjustLayoutForDevice() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        
        // Adjust control panel layout
        const controlPanel = document.getElementById('control-panel');
        if (isMobile) {
            controlPanel.classList.add('mobile-layout');
        } else if (isTablet) {
            controlPanel.classList.add('tablet-layout');
        } else {
            controlPanel.classList.remove('mobile-layout', 'tablet-layout');
        }
        
        // Adjust legend and info panel positions
        this.adjustPanelPositions(isMobile, isTablet);
    }
    
    adjustPanelPositions(isMobile, isTablet) {
        const legend = document.getElementById('legend');
        const infoPanel = document.getElementById('info-panel');
        const comparisonPanel = document.getElementById('scenario-comparison');
        
        if (isMobile) {
            // Mobile adjustments
            if (legend) legend.classList.add('mobile-position');
            if (infoPanel) infoPanel.classList.add('mobile-position');
            if (comparisonPanel) comparisonPanel.classList.add('mobile-position');
        } else {
            // Desktop/tablet adjustments
            if (legend) legend.classList.remove('mobile-position');
            if (infoPanel) infoPanel.classList.remove('mobile-position');
            if (comparisonPanel) comparisonPanel.classList.remove('mobile-position');
        }
    }
    
    // Initialize responsive layout
    initializeResponsiveLayout() {
        this.adjustLayoutForDevice();
        
        // Listen for resize events
        window.addEventListener('resize', () => {
            this.adjustLayoutForDevice();
        });
        
        // Listen for orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayoutForDevice();
            }, 100);
        });
    }
    
    // Accessibility improvements
    setupAccessibility() {
        // Add keyboard navigation for custom controls
        this.setupKeyboardNavigation();
        
        // Add ARIA labels where missing
        this.addAriaLabels();
        
        // Setup focus management
        this.setupFocusManagement();
    }
    
    setupKeyboardNavigation() {
        // Add keyboard support for scenario buttons
        document.querySelectorAll('.scenario-btn').forEach((btn, index) => {
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const buttons = document.querySelectorAll('.scenario-btn');
                    const nextIndex = e.key === 'ArrowRight' ? 
                        (index + 1) % buttons.length : 
                        (index - 1 + buttons.length) % buttons.length;
                    buttons[nextIndex].focus();
                }
            });
        });
    }
    
    addAriaLabels() {
        // Add labels for better screen reader support
        const yearSliders = document.querySelectorAll('.year-slider');
        yearSliders.forEach(slider => {
            if (!slider.getAttribute('aria-label')) {
                slider.setAttribute('aria-label', 
                    slider.id.includes('min') ? 'Minimum year' : 'Maximum year'
                );
            }
        });
    }
    
    setupFocusManagement() {
        // Manage focus for better keyboard navigation
        const firstFocusable = document.querySelector('button, input, select');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}