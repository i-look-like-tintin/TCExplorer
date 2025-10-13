class UIController {
    constructor(app) {
        this.app = app;
        this.lastChangedSlider = null;
    }
    
    initializeEventListeners() {
        this.setupDataSourceSelector();
        this.setupRegionSelector();
        this.setupScenarioDropdown();
        this.setupEnsembleControls();
        this.setupVisualizationToggles();
        this.setupYearRangeControls();
        this.setupActionButtons();
        this.setupComparisonControls();
        this.setupDesktopCollapsible();
        this.setupTutorialControls();
        this.setupScrollableIndicators();

        // Update dynamic version information
        this.updateFooterVersion();

        // Initialize data source UI based on current selection
        this.updateDataSourceUI(this.app.dataSource);
    }

    setupDataSourceSelector() {
        const dataSourceSelect = document.getElementById('data-source-select');
        if (dataSourceSelect) {
            // Set initial value
            dataSourceSelect.value = this.app.dataSource;

            // Add change event listener
            dataSourceSelect.addEventListener('change', async (e) => {
                await this.app.changeDataSource(e.target.value);
            });
        }
    }

    setupRegionSelector() {
        const regionSelect = document.getElementById('region-select');
        if (regionSelect) {
            // Set initial value
            regionSelect.value = this.app.currentRegion;

            // Add change event listener
            regionSelect.addEventListener('change', async (e) => {
                await this.app.changeRegion(e.target.value);
            });
        }
    }

    updateDataSourceUI(dataSource) {
        // Get data source configuration
        const dataSourceConfig = TCConfigUtils.getDataSource(dataSource);
        if (!dataSourceConfig) return;

        // Get control elements
        const scenarioGroup = document.getElementById('scenario-select')?.closest('.control-group');
        const ensembleGroup = document.getElementById('ensemble-select')?.closest('.control-group');
        const sstSelector = document.getElementById('sst-selector');
        const comparisonToggle = document.getElementById('comparison-mode');
        const dataSourceInfo = document.getElementById('data-source-info');
        const regionSelectorGroup = document.getElementById('region-selector-group');

        if (dataSource === 'real') {
            // Hide/disable controls not compatible with real data
            if (scenarioGroup) scenarioGroup.style.display = 'none';
            if (ensembleGroup) ensembleGroup.style.display = 'none';
            if (sstSelector) sstSelector.style.display = 'none';
            if (comparisonToggle) {
                comparisonToggle.disabled = true;
                comparisonToggle.checked = false;
            }

            // Show region selector for real data
            if (regionSelectorGroup) regionSelectorGroup.style.display = 'flex';

            // Update year slider bounds for real data
            const yearRange = this.app.realDataYearRange || dataSourceConfig.yearRange;
            if (yearRange) {
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');

                if (yearMinSlider && yearMaxSlider) {
                    yearMinSlider.min = yearRange.min;
                    yearMinSlider.max = yearRange.max;
                    yearMinSlider.value = yearRange.min;

                    yearMaxSlider.min = yearRange.min;
                    yearMaxSlider.max = yearRange.max;
                    yearMaxSlider.value = yearRange.max;

                    this.updateSliderRange();
                    this.updateYearDisplay();
                }
            }

            // Show info message
            if (dataSourceInfo) {
                dataSourceInfo.textContent = `Real historical data: ${dataSourceConfig.source}`;
                dataSourceInfo.style.display = 'block';
            }
        } else {
            // Show/enable all controls for simulated data
            if (scenarioGroup) scenarioGroup.style.display = 'flex';
            if (ensembleGroup) ensembleGroup.style.display = 'flex';
            if (comparisonToggle) {
                comparisonToggle.disabled = false;
            }

            // Hide region selector for simulated data
            if (regionSelectorGroup) regionSelectorGroup.style.display = 'none';

            // Restore year slider bounds based on current scenario
            this.updateYearSlider();

            // Hide info message
            if (dataSourceInfo) {
                dataSourceInfo.style.display = 'none';
            }

            // Update SST selector visibility based on current scenario
            this.updateEnsembleSelector();
        }
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

        // Setup visibility toggles
        const visA = document.getElementById('scenario-a-visible');
        const visB = document.getElementById('scenario-b-visible');

        if (visA) {
            visA.addEventListener('change', async (e) => {
                await this.toggleScenarioVisibility('A', e.target.checked);
            });
        }

        if (visB) {
            visB.addEventListener('change', async (e) => {
                await this.toggleScenarioVisibility('B', e.target.checked);
            });
        }

        // Setup separate year sliders for comparison mode
        this.setupComparisonYearControls();
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

        document.getElementById('colorblind-mode').addEventListener('change', async (e) => {
            await this.app.toggleColorBlindMode(e.target.checked);
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
        } else if (this.app.dataSource === 'real') {
            // Use real data year range for real historical data
            const bounds = this.app.realDataYearRange;
            min = Math.max(bounds.min, Math.min(bounds.max, min));
            max = Math.max(bounds.min, Math.min(bounds.max, max));
        } else {
            // Use scenario year ranges for simulated data
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

        const aboutButton = document.getElementById('about-btn');
        if (aboutButton) {
            aboutButton.addEventListener('click', () => {
                this.showAboutDialog();
            });
        }
    }
    
    updateComparisonUI(comparisonMode) {
        const singleModeControls = document.getElementById('single-mode-controls');
        const comparisonModeControls = document.getElementById('comparison-mode-controls');

        if (comparisonMode) {
            singleModeControls.style.display = 'none';
            comparisonModeControls.style.display = 'flex';
            this.updateComparisonEnsembleSelectors();
            this.updateComparisonYearSliders();
        } else {
            singleModeControls.style.display = 'flex';
            comparisonModeControls.style.display = 'none';
            this.updateEnsembleSelector();
            this.updateYearSlider();
        }
    }

    // Setup comparison-specific year controls
    setupComparisonYearControls() {
        // Setup year sliders for Scenario A
        const yearMinSliderA = document.getElementById('year-slider-a-min');
        const yearMaxSliderA = document.getElementById('year-slider-a-max');

        if (yearMinSliderA && yearMaxSliderA) {
            yearMinSliderA.addEventListener('input', () => {
                this.updateScenarioYearRange('A');
            });

            yearMaxSliderA.addEventListener('input', () => {
                this.updateScenarioYearRange('A');
            });
        }

        // Setup year sliders for Scenario B
        const yearMinSliderB = document.getElementById('year-slider-b-min');
        const yearMaxSliderB = document.getElementById('year-slider-b-max');

        if (yearMinSliderB && yearMaxSliderB) {
            yearMinSliderB.addEventListener('input', () => {
                this.updateScenarioYearRange('B');
            });

            yearMaxSliderB.addEventListener('input', () => {
                this.updateScenarioYearRange('B');
            });
        }
    }

    // Update year range for specific scenario
    updateScenarioYearRange(scenario) {
        const minSlider = document.getElementById(`year-slider-${scenario.toLowerCase()}-min`);
        const maxSlider = document.getElementById(`year-slider-${scenario.toLowerCase()}-max`);
        const yearDisplay = document.getElementById(`year-display-${scenario.toLowerCase()}`);
        const sliderRange = document.getElementById(`slider-range-${scenario.toLowerCase()}`);

        if (!minSlider || !maxSlider) return;

        let min = parseInt(minSlider.value);
        let max = parseInt(maxSlider.value);

        // Prevent sliders from crossing
        if (min > max) {
            [min, max] = [max, min];
            minSlider.value = min;
            maxSlider.value = max;
        }

        // Update display
        yearDisplay.textContent = min === max ? `Year: ${min}` : `Years: ${min} - ${max}`;

        // Update slider range visual
        if (sliderRange) {
            const minPercent = ((min - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
            const maxPercent = ((max - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
            sliderRange.style.left = `${minPercent}%`;
            sliderRange.style.width = `${maxPercent - minPercent}%`;
        }

        // Update app year range for this scenario
        if (scenario === 'A') {
            this.app.comparisonYearRangeA = { min, max };
        } else {
            this.app.comparisonYearRangeB = { min, max };
        }

        // Apply filter if in comparison mode
        if (this.app.comparisonMode) {
            clearTimeout(this.yearUpdateTimeout);
            this.yearUpdateTimeout = setTimeout(async () => {
                await this.app.updateVisualization();
            }, 300);
        }
    }

    // Toggle visibility of a scenario
    async toggleScenarioVisibility(scenario, visible) {
        if (scenario === 'A') {
            this.app.scenarioAVisible = visible;
        } else {
            this.app.scenarioBVisible = visible;
        }

        // Update UI to show/hide scenario
        const scenarioElement = document.querySelector(`.comparison-scenario[data-scenario="${scenario}"]`);
        if (scenarioElement) {
            scenarioElement.classList.toggle('scenario-disabled', !visible);
        }

        // Update visualization
        if (this.app.comparisonMode) {
            await this.app.updateVisualization();
        }
    }

    // Update year sliders when scenarios change
    updateComparisonYearSliders() {
        // Update Scenario A year sliders
        this.updateScenarioYearSlider('A', this.app.comparisonScenarioA);

        // Update Scenario B year sliders
        this.updateScenarioYearSlider('B', this.app.comparisonScenarioB);
    }

    // Update individual scenario year slider bounds
    updateScenarioYearSlider(scenario, scenarioKey) {
        const minSlider = document.getElementById(`year-slider-${scenario.toLowerCase()}-min`);
        const maxSlider = document.getElementById(`year-slider-${scenario.toLowerCase()}-max`);

        if (!minSlider || !maxSlider) return;

        const bounds = this.app.scenarioYearRanges[scenarioKey];
        if (!bounds) return;

        // Always reset to full range when scenario changes
        minSlider.min = bounds.min;
        minSlider.max = bounds.max;
        minSlider.value = bounds.min;

        maxSlider.min = bounds.min;
        maxSlider.max = bounds.max;
        maxSlider.value = bounds.max;

        this.updateScenarioYearRange(scenario);
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
            } else if (this.app.dataSource === 'real') {
                // Use real data year range for display
                const bounds = this.app.realDataYearRange;

                if (min === bounds.min && max === bounds.max) {
                    yearDisplay.textContent = `${bounds.min} - ${bounds.max}`;
                } else if (min === max) {
                    yearDisplay.textContent = `Year: ${min}`;
                } else {
                    yearDisplay.textContent = `${min} - ${max}`;
                }
            } else {
                // Use scenario year ranges for simulated data
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

        // Get genesis coordinates - fallback to first track point if not available
        let genesisLat = cyclone.genesis_lat;
        let genesisLon = cyclone.genesis_lon;

        if ((genesisLat === undefined || genesisLon === undefined) && cyclone.track && cyclone.track.length > 0) {
            genesisLat = cyclone.track[0].lat;
            genesisLon = cyclone.track[0].lon;
        }

        const genesisText = (genesisLat !== undefined && genesisLon !== undefined)
            ? `${genesisLat.toFixed(2)}°, ${genesisLon.toFixed(2)}°`
            : 'Unknown';

        details.innerHTML = `
            <p><strong>ID:</strong> ${cyclone.id}</p>
            <p><strong>Name:</strong> ${cyclone.name}</p>
            <p><strong>Year:</strong> ${cyclone.year}</p>
            <p><strong>Max Category:</strong> ${cyclone.maxCategory}</p>
            <p><strong>Max Wind Speed:</strong> ${cyclone.maxWind} km/h</p>
            <p><strong>Min Pressure:</strong> ${cyclone.minPressure || 'N/A'} hPa</p>
            <p><strong>Duration:</strong> ${cyclone.duration_days || cyclone.duration} days</p>
            <p><strong>Genesis:</strong> ${genesisText}</p>
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

    setupTutorialControls() {
        const restartButton = document.getElementById('restart-tutorial');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                if (this.app.tutorialManager) {
                    this.app.tutorialManager.restartTutorial();
                }
            });
        }

        // Add mobile tutorial restart option to FAB menu
        const isMobile = this.app.deviceManager && this.app.deviceManager.isMobile();
        if (isMobile) {
            this.addMobileTutorialOption();
        }
    }

    addMobileTutorialOption() {
        // Add tutorial restart option to mobile controls
        const mobileControls = document.getElementById('mobile-controls-content');
        if (mobileControls) {
            // Check if already added
            if (document.getElementById('mobile-tutorial-restart')) return;

            const tutorialGroup = document.createElement('div');
            tutorialGroup.className = 'control-group';
            tutorialGroup.innerHTML = `
                <button id="mobile-tutorial-restart" class="export-btn" style="width: 100%; margin-top: 10px;">
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
    }

    setupScrollableIndicators() {
        // Set up scrollable indicators for toggle options
        const toggleOptions = document.querySelector('.toggle-options');
        if (!toggleOptions) return;

        const updateScrollIndicators = () => {
            const hasScroll = toggleOptions.scrollHeight > toggleOptions.clientHeight;
            if (hasScroll) {
                toggleOptions.classList.add('has-scroll');
            } else {
                toggleOptions.classList.remove('has-scroll');
            }
        };

        // Initial check
        updateScrollIndicators();

        // Listen for content changes and window resize
        const observer = new MutationObserver(updateScrollIndicators);
        observer.observe(toggleOptions, { childList: true, subtree: true });

        window.addEventListener('resize', updateScrollIndicators);

        // Add scroll listener to manage fade effects dynamically
        toggleOptions.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = toggleOptions;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

            // Dynamically adjust fade effects based on scroll position
            const beforeElement = window.getComputedStyle(toggleOptions, '::before');
            const afterElement = window.getComputedStyle(toggleOptions, '::after');

            if (isAtTop) {
                toggleOptions.style.setProperty('--top-fade-opacity', '0');
            } else {
                toggleOptions.style.setProperty('--top-fade-opacity', '1');
            }

            if (isAtBottom) {
                toggleOptions.style.setProperty('--bottom-fade-opacity', '0');
            } else {
                toggleOptions.style.setProperty('--bottom-fade-opacity', '1');
            }
        });

    }

    showAboutDialog() {
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal) {
            // Update version information dynamically from config
            this.updateAboutVersionInfo();

            aboutModal.style.display = 'flex';
            document.body.classList.add('modal-open');

            // Set up close functionality
            const closeButton = aboutModal.querySelector('.modal-close');
            const modalContent = aboutModal.querySelector('.modal-content');

            const closeModal = () => {
                this.hideAboutDialog();
            };

            // Close button
            if (closeButton) {
                closeButton.addEventListener('click', closeModal);
            }

            // Click outside to close
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    closeModal();
                }
            });

            // Escape key to close
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    }

    hideAboutDialog() {
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal) {
            aboutModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    updateAboutVersionInfo() {
        // Get version information from config
        const version = window.TCConfig?.app?.version || '1.0.0a';
        const buildDate = window.TCConfig?.app?.buildDate || '2025-09-29';

        // Find the version information section in the About dialog
        const versionSection = document.querySelector('#about-modal .about-section:last-child p');
        if (versionSection) {
            versionSection.innerHTML = `
                <strong>Version:</strong> ${version}<br>
                <strong>Build Date:</strong> ${buildDate}<br>
                <strong>License:</strong> GNU General Public License-3.0
            `;
        }
    }

    updateFooterVersion() {
        // Get version information from config
        const version = window.TCConfig?.app?.version || '1.0.0a';
        const appName = window.TCConfig?.app?.name || 'TC Explorer';

        // Update footer version
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            // Extract the short name from the full app name
            const shortName = appName.includes('Tropical Cyclone') ? 'TC Explorer' : appName;
            versionElement.textContent = `${shortName} v${version}`;
        }
    }
}