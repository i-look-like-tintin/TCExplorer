class UIController {
    constructor(app) {
        this.app = app;
        this.lastChangedSlider = null;
    }
    
    initializeEventListeners() {
        this.setupScenarioDropdown();
        this.setupEnsembleControls();
        this.setupVisualizationToggles();
        this.setupYearRangeControls();
        this.setupActionButtons();
        this.setupComparisonControls();
        this.setupDesktopCollapsible();

        console.log('Event listeners initialized');
    }
    
    setupComparisonControls() {
        document.getElementById('comparison-mode').addEventListener('change', async (e) => {
            await this.app.toggleComparisonMode(e.target.checked);
        });
        
        document.getElementById('scenario-a-select').addEventListener('change', async (e) => {
            await this.app.changeComparisonScenario('A', e.target.value);
        });
        
        document.getElementById('scenario-b-select').addEventListener('change', async (e) => {
            await this.app.changeComparisonScenario('B', e.target.value);
        });
        
        document.getElementById('ensemble-a-select').addEventListener('change', async (e) => {
            await this.app.changeComparisonEnsemble('A', parseInt(e.target.value));
        });
        
        document.getElementById('ensemble-b-select').addEventListener('change', async (e) => {
            await this.app.changeComparisonEnsemble('B', parseInt(e.target.value));
        });
        
        document.getElementById('sst-a-select').addEventListener('change', async (e) => {
            await this.app.changeComparisonSST('A', e.target.value);
        });
        
        document.getElementById('sst-b-select').addEventListener('change', async (e) => {
            await this.app.changeComparisonSST('B', e.target.value);
        });
    }
    
    setupScenarioDropdown() {
        const scenarioSelect = document.getElementById('scenario-select');
        if (scenarioSelect) {
            scenarioSelect.addEventListener('change', async (e) => {
                await this.handleScenarioChange(e);
            });
        }
    }
    
    async handleScenarioChange(e) {
        const newScenario = e.target.value;
        await this.app.changeScenario(newScenario);
    }
    
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
    
    setupVisualizationToggles() {
        document.getElementById('show-heatmap').addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            if (enabled) {
                this.setTrackDisplays(false);
                this.app.mapManager.saveMapState();
            }
            await this.app.toggleVisualizationMode('heatmap', enabled);
        });
        
        ['show-tracks', 'show-genesis', 'show-intensity'].forEach(id => {
            document.getElementById(id).addEventListener('change', async (e) => {
                if (e.target.checked && this.app.showHeatmap) {
                    document.getElementById('show-heatmap').checked = false;
                    this.app.showHeatmap = false;
                    this.enableYearControls();
                }

                const layerName = id.replace('show-', '');
                this.app.mapManager.toggleLayer(layerName, e.target.checked);
                await this.app.updateVisualization();
            });
        });

        document.getElementById('show-pre-cat1').addEventListener('change', async (e) => {
            await this.app.updateVisualization();
        });
    }
    
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
        
        if (this.app.comparisonMode) {
            const boundsA = this.app.scenarioYearRanges[this.app.comparisonScenarioA];
            const boundsB = this.app.scenarioYearRanges[this.app.comparisonScenarioB];
            
            const minYear = Math.min(boundsA.min, boundsB.min);
            const maxYear = Math.max(boundsA.max, boundsB.max);
            
            min = Math.max(minYear, Math.min(maxYear, min));
            max = Math.max(minYear, Math.min(maxYear, max));
        } else {
            const bounds = this.app.scenarioYearRanges[this.app.currentScenario];
            min = Math.max(bounds.min, Math.min(bounds.max, min));
            max = Math.max(bounds.min, Math.min(bounds.max, max));
        }
        
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
    
    setupActionButtons() {
        document.getElementById('export-data').addEventListener('click', () => {
            this.app.exportData();
        });
        
        document.getElementById('refresh-data').addEventListener('click', async () => {
            if (this.app.comparisonMode) {
                await this.app.loadComparisonData();
            } else {
                await this.app.dataManager.loadData(true);
            }
        });
    }
    
    updateComparisonUI(comparisonMode) {
        const singleModeControls = document.getElementById('single-mode-controls');
        const comparisonModeControls = document.getElementById('comparison-mode-controls');
        
        if (comparisonMode) {
            singleModeControls.style.display = 'none';
            comparisonModeControls.style.display = 'flex';
            this.updateComparisonEnsembleSelectors();
            this.updateComparisonYearSlider();
        } else {
            singleModeControls.style.display = 'flex';
            comparisonModeControls.style.display = 'none';
            this.updateEnsembleSelector();
            this.updateYearSlider();
        }
    }
    
    updateComparisonEnsembleSelectors() {
        this.updateComparisonScenarioControls('A', this.app.comparisonScenarioA);
        this.updateComparisonScenarioControls('B', this.app.comparisonScenarioB);
    }
    
    updateComparisonScenarioControls(scenarioType, scenario) {
        const ensembleSelect = document.getElementById(`ensemble-${scenarioType.toLowerCase()}-select`);
        const sstSelector = document.getElementById(`sst-${scenarioType.toLowerCase()}-selector`);
        const ensembleInfo = document.getElementById(`ensemble-${scenarioType.toLowerCase()}-info`);
        
        const ensembleLimits = {
            'current': { max: 100, note: '(1-100)' },
            'nat': { max: 60, note: '(1-60)' },
            '2k': { max: 9, note: '(101-109 on server)' },
            '4k': { max: 15, note: '(101-115 on server)' }
        };
        
        const limit = ensembleLimits[scenario];
        
        if (ensembleInfo) {
            ensembleInfo.textContent = limit.note;
        }
        
        if (scenario === '2k' || scenario === '4k') {
            if (sstSelector) sstSelector.style.display = 'flex';
        } else {
            if (sstSelector) sstSelector.style.display = 'none';
        }
        
        if (ensembleSelect) {
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
                if (scenarioType === 'A') {
                    this.app.comparisonEnsembleA = 1;
                } else {
                    this.app.comparisonEnsembleB = 1;
                }
            }
        }
    }
    
    updateComparisonYearSlider() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        
        const boundsA = this.app.scenarioYearRanges[this.app.comparisonScenarioA];
        const boundsB = this.app.scenarioYearRanges[this.app.comparisonScenarioB];
        
        const minYear = Math.min(boundsA.min, boundsB.min);
        const maxYear = Math.max(boundsA.max, boundsB.max);
        
        yearMinSlider.min = minYear;
        yearMinSlider.max = maxYear;
        yearMinSlider.value = minYear;
        
        yearMaxSlider.min = minYear;
        yearMaxSlider.max = maxYear;
        yearMaxSlider.value = maxYear;
        
        this.app.yearRange = null;
        this.updateSliderRange();
        this.updateYearDisplay();
    }
    
    updateEnsembleSelector() {
        const ensembleInfo = document.getElementById('ensemble-info');
        const ensembleSelect = document.getElementById('ensemble-select');
        const sstSelector = document.getElementById('sst-selector');
        
        const ensembleLimits = {
            'current': { max: 100, available: 100, note: '(1-100 available)' },
            'nat': { max: 60, available: 60, note: '(1-60 available)' },
            '2k': { max: 9, available: 9, note: '(101-109 on server)' },
            '4k': { max: 15, available: 15, note: '(101-115 on server)' }
        };
        
        const limit = ensembleLimits[this.app.currentScenario];
        
        ensembleInfo.textContent = limit.note;
        
        if (this.app.currentScenario === '2k' || this.app.currentScenario === '4k') {
            sstSelector.style.display = 'flex';
        } else {
            sstSelector.style.display = 'none';
        }
        
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
        
        if (this.app.showHeatmap) {
            yearDisplay.textContent = 'All Years (Severity Mode)';
        } else {
            const min = parseInt(yearMinSlider.value);
            const max = parseInt(yearMaxSlider.value);
            
            if (this.app.comparisonMode) {
                const boundsA = this.app.scenarioYearRanges[this.app.comparisonScenarioA];
                const boundsB = this.app.scenarioYearRanges[this.app.comparisonScenarioB];
                const minYear = Math.min(boundsA.min, boundsB.min);
                const maxYear = Math.max(boundsA.max, boundsB.max);
                
                if (min === minYear && max === maxYear) {
                    yearDisplay.textContent = `${minYear} - ${maxYear} (Both scenarios)`;
                } else if (min === max) {
                    yearDisplay.textContent = `Year: ${min}`;
                } else {
                    yearDisplay.textContent = `${min} - ${max}`;
                }
            } else {
                const bounds = this.app.scenarioYearRanges[this.app.currentScenario];
                
                if (min === bounds.min && max === bounds.max) {
                    yearDisplay.textContent = `${bounds.min} - ${bounds.max}`;
                } else if (min === max) {
                    yearDisplay.textContent = `Year: ${min}`;
                } else {
                    yearDisplay.textContent = `${min} - ${max}`;
                }
            }
        }
    }
    
    disableYearControls(mode) {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        yearMinSlider.disabled = true;
        yearMaxSlider.disabled = true;
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
    
    disableHeatmapControls() {
        document.getElementById('show-heatmap').disabled = true;
        document.getElementById('show-heatmap').checked = false;
    }
    
    enableHeatmapControls() {
        document.getElementById('show-heatmap').disabled = false;
    }
    
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
        
        setTimeout(() => {
            infoPanel.classList.add('hidden');
        }, 10000);
    }
    
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
    
    adjustLayoutForDevice() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        
        const controlPanel = document.getElementById('control-panel');
        if (isMobile) {
            controlPanel.classList.add('mobile-layout');
        } else if (isTablet) {
            controlPanel.classList.add('tablet-layout');
        } else {
            controlPanel.classList.remove('mobile-layout', 'tablet-layout');
        }
        
        this.adjustPanelPositions(isMobile, isTablet);
    }
    
    adjustPanelPositions(isMobile, isTablet) {
        const legend = document.getElementById('legend');
        const infoPanel = document.getElementById('info-panel');
        const comparisonPanel = document.getElementById('scenario-comparison');
        
        if (isMobile) {
            if (legend) legend.classList.add('mobile-position');
            if (infoPanel) infoPanel.classList.add('mobile-position');
            if (comparisonPanel) comparisonPanel.classList.add('mobile-position');
        } else {
            if (legend) legend.classList.remove('mobile-position');
            if (infoPanel) infoPanel.classList.remove('mobile-position');
            if (comparisonPanel) comparisonPanel.classList.remove('mobile-position');
        }
    }
    
    initializeResponsiveLayout() {
        this.adjustLayoutForDevice();

        window.addEventListener('resize', () => {
            this.adjustLayoutForDevice();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayoutForDevice();
            }, 100);
        });
    }

    setupDesktopCollapsible() {
        // Only setup collapsible for desktop mode
        if (window.innerWidth <= 1024) return;

        const controlPanel = document.getElementById('control-panel');
        if (!controlPanel || document.getElementById('desktop-panel-toggle')) return;

        // Create wrapper for desktop collapsible
        const wrapper = document.createElement('div');
        wrapper.className = 'desktop-collapsible-wrapper';
        controlPanel.parentNode.insertBefore(wrapper, controlPanel);
        wrapper.appendChild(controlPanel);

        // Create toggle button for desktop
        const toggleButton = document.createElement('button');
        toggleButton.id = 'desktop-panel-toggle';
        toggleButton.className = 'desktop-toggle-button';
        toggleButton.innerHTML = `
            <span class="toggle-icon">▲</span>
            <span class="toggle-text">Hide Controls</span>
        `;
        toggleButton.setAttribute('aria-label', 'Toggle control panel');
        toggleButton.setAttribute('aria-expanded', 'true');
        toggleButton.setAttribute('title', 'Click to toggle controls (Ctrl+P)');

        // Append button to document body so it's always visible
        document.body.appendChild(toggleButton);
        wrapper.appendChild(controlPanel);

        // Initialize as expanded
        this.desktopPanelExpanded = true;
        controlPanel.classList.add('desktop-expanded');

        // Add click handler
        toggleButton.addEventListener('click', () => {
            this.toggleDesktopControlPanel();
        });

        // Add keyboard shortcut (Ctrl/Cmd + P)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
                e.preventDefault();
                this.toggleDesktopControlPanel();
            }
        });
    }

    toggleDesktopControlPanel() {
        const controlPanel = document.getElementById('control-panel');
        const toggleButton = document.getElementById('desktop-panel-toggle');
        const wrapper = document.querySelector('.desktop-collapsible-wrapper');
        const toggleIcon = toggleButton?.querySelector('.toggle-icon');

        if (!controlPanel || !toggleButton || !wrapper) return;

        this.desktopPanelExpanded = !this.desktopPanelExpanded;

        toggleButton.setAttribute('aria-expanded', this.desktopPanelExpanded.toString());

        const toggleText = toggleButton?.querySelector('.toggle-text');

        if (this.desktopPanelExpanded) {
            controlPanel.classList.remove('desktop-collapsed');
            controlPanel.classList.add('desktop-expanded');
            wrapper.classList.remove('collapsed');
            document.body.classList.remove('controls-collapsed');
            if (toggleIcon) toggleIcon.textContent = '▲';
            if (toggleText) toggleText.textContent = 'Hide Controls';
            toggleButton.setAttribute('title', 'Click to hide controls (Ctrl+P)');
            toggleButton.classList.remove('collapsed-state');
        } else {
            controlPanel.classList.remove('desktop-expanded');
            controlPanel.classList.add('desktop-collapsed');
            wrapper.classList.add('collapsed');
            document.body.classList.add('controls-collapsed');
            if (toggleIcon) toggleIcon.textContent = '▼';
            if (toggleText) toggleText.textContent = 'Show Controls';
            toggleButton.setAttribute('title', 'Click to show controls (Ctrl+P)');
            toggleButton.classList.add('collapsed-state');
        }

        // Show notification only when first collapsed
        if (!this.desktopPanelExpanded && !this.desktopShortcutNotified) {
            this.desktopShortcutNotified = true;
            this.app.utils.showNotification(
                'Tip: Use Ctrl+P (Cmd+P on Mac) to quickly toggle controls',
                'info',
                5000
            );
        }

        // Adjust map container if needed
        if (this.app.mapManager) {
            setTimeout(() => {
                this.app.mapManager.map.invalidateSize();
            }, 350);
        }
    }
}