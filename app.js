class TCVisualization {
    constructor() {
        this.map = null;
        this.currentScenario = 'current';
        this.currentEnsemble = 1;
        this.currentSSTModel = 'CC';
        this.cycloneData = {};
        this.layers = {
            tracks: L.layerGroup(),
            genesis: L.layerGroup(),
            intensity: L.layerGroup(),
            heatmap: null
        };
        this.selectedCyclone = null;
        this.filterAustralia = true;
        this.yearRange = null;
        this.scenarioYearRanges = {
            'current': { min: 1951, max: 2011 },
            '2k': { min: 2031, max: 2090 },
            '4k': { min: 2051, max: 2110 }
        };
        this.heatmapZoomLevel = 4;
        this.previousZoom = null;
        this.previousCenter = null;
        this.showHeatmap = false;
        this.showDensityHeatmap = false;
        this.heatmapData = null; 
        this.currentZoom = 4; 
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.initEventListeners();
        this.updateEnsembleSelector();
        this.updateYearSlider();
        this.loadData();
        this.createComparisonPanel();
    }
    
    initMap() {
        this.map = L.map('map').setView([-25.2744, 133.7751], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | Data: d4PDF'
        }).addTo(this.map);
        
        this.layers.tracks.addTo(this.map);
        this.layers.genesis.addTo(this.map);
        this.layers.intensity.addTo(this.map);
        
        this.addAustraliaBoundaries();
        
        let zoomTimeout;
        this.map.on('zoomstart', () => {
            if (this.layers.heatmap) {
                this.map.getContainer().classList.add('zooming');
            }
        });
        
        this.map.on('zoomend', () => {
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(() => {
                if ((this.showHeatmap || this.showDensityHeatmap) && this.heatmapConfig) {
                    const currentZoom = this.map.getZoom();
                    const radius = this.heatmapConfig.baseRadius * Math.pow(2, (currentZoom - 4) * 0.7);
                    const blur = 15 + (currentZoom - 4) * 3;
                    
                    if (this.layers.heatmap) {
                        this.map.removeLayer(this.layers.heatmap);
                    }
                    
                    const heatmapOptions = {
                        radius: Math.min(80, Math.max(15, radius)),
                        blur: Math.min(40, Math.max(10, blur)),
                        maxZoom: 17,
                        max: this.heatmapConfig.maxValue || 1.0,
                        gradient: this.heatmapConfig.gradient,
                        minOpacity: this.showDensityHeatmap ? 0.4 : 0.3
                    };
                    
                    this.layers.heatmap = L.heatLayer(this.heatmapConfig.data, heatmapOptions);
                    
                    this.layers.heatmap.addTo(this.map);
                }
                
                this.map.getContainer().classList.remove('zooming');
            }, 100);
        });
    }

    
    addAustraliaBoundaries() {
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson')
            .then(response => response.json())
            .then(data => {
                // Find Australia in the features
                const australia = data.features.find(f => f.properties.NAME === 'Australia');
                
                if (australia) {
                    L.geoJSON(australia, {
                        style: {
                            color: '#2c3e50',
                            weight: 2,
                            fillColor: '#3498db',
                            fillOpacity: 0.05,
                            interactive: false
                        }
                    }).addTo(this.map);
                }
            })
            .catch(error => {
                console.error('Failed to load Australia boundaries:', error);
                // Fallback to simplified polygon - its pretty terrible tho so could probs remove
                this.addSimplifiedAustraliaBoundaries();
            });
    }
    
    addSimplifiedAustraliaBoundaries() {
        // Simplified Australia polygon  -again, pretty terrible
        const australiaBounds = [
            [-10.6, 113.3], [-13.7, 130.8], [-12.5, 136.7], [-14.5, 145.4],
            [-18.3, 146.3], [-24.5, 153.6], [-32.5, 152.5], [-37.5, 149.9],
            [-39.2, 146.3], [-38.5, 140.9], [-35.1, 136.7], [-34.3, 135.2],
            [-32.5, 133.6], [-31.3, 128.9], [-25.9, 122.2], [-19.7, 121.5],
            [-17.3, 122.2], [-14.6, 125.8], [-11.3, 130.2], [-10.6, 113.3]
        ];
        
        L.polygon(australiaBounds, {
            color: '#2c3e50',
            weight: 2,
            fillOpacity: 0.1,
            interactive: false
        }).addTo(this.map);
    }
    
    initEventListeners() {

        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleScenarioChange(e));
        });

        document.getElementById('ensemble-select').addEventListener('change', (e) => {
            this.currentEnsemble = parseInt(e.target.value);
            this.loadData();
        });
        
        document.getElementById('sst-select').addEventListener('change', (e) => {
            this.currentSSTModel = e.target.value;
            this.loadData();
        });
        
        document.getElementById('show-heatmap').addEventListener('change', (e) => {
            this.showHeatmap = e.target.checked;
            if (this.showHeatmap) {
                this.previousZoom = this.map.getZoom();
                this.previousCenter = this.map.getCenter();
                
                document.getElementById('show-density-heatmap').checked = false;
                this.showDensityHeatmap = false;
                document.getElementById('show-tracks').checked = false;
                document.getElementById('show-genesis').checked = false;
                document.getElementById('show-intensity').checked = false;
                this.toggleLayer('tracks', false);
                this.toggleLayer('genesis', false);
                this.toggleLayer('intensity', false);
                
                this.map.setView([-25.2744, 133.7751], this.heatmapZoomLevel, {
                    animate: true,
                    duration: 0.5
                });
                
                this.map.scrollWheelZoom.disable();
                this.map.doubleClickZoom.disable();
                this.map.touchZoom.disable();
                this.map.boxZoom.disable();
                this.map.keyboard.disable();
                
                this.map.zoomControl.remove();
                
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');
                const yearDisplay = document.getElementById('year-display');
                const bounds = this.scenarioYearRanges[this.currentScenario];
                
                yearMinSlider.disabled = true;
                yearMaxSlider.disabled = true;
                yearMinSlider.value = bounds.min;
                yearMaxSlider.value = bounds.max;
                yearDisplay.textContent = 'All Years (Severity Mode)';
                yearDisplay.classList.add('disabled');
                this.yearRange = null;
                this.updateSliderRange();

                this.showZoomLockNotice();
            } else {
                this.map.scrollWheelZoom.enable();
                this.map.doubleClickZoom.enable();
                this.map.touchZoom.enable();
                this.map.boxZoom.enable();
                this.map.keyboard.enable();
                
                this.map.zoomControl.addTo(this.map);
                
                if (this.previousZoom && this.previousCenter) {
                    this.map.setView(this.previousCenter, this.previousZoom, {
                        animate: true,
                        duration: 0.5
                    });
                }
                
                this.removeZoomLockNotice();
            }
            this.updateVisualization();
        });
        
        
        document.getElementById('show-density-heatmap').addEventListener('change', (e) => {
            this.showDensityHeatmap = e.target.checked;
            if (this.showDensityHeatmap) {
                this.previousZoom = this.map.getZoom();
                this.previousCenter = this.map.getCenter();
                
                document.getElementById('show-heatmap').checked = false;
                this.showHeatmap = false;
                document.getElementById('show-tracks').checked = false;
                document.getElementById('show-genesis').checked = false;
                document.getElementById('show-intensity').checked = false;
                this.toggleLayer('tracks', false);
                this.toggleLayer('genesis', false);
                this.toggleLayer('intensity', false);
                
                this.map.setView([-25.2744, 133.7751], this.heatmapZoomLevel, {
                    animate: true,
                    duration: 0.5
                });
                
                this.map.scrollWheelZoom.disable();
                this.map.doubleClickZoom.disable();
                this.map.touchZoom.disable();
                this.map.boxZoom.disable();
                this.map.keyboard.disable();
                
                this.map.zoomControl.remove();
                
                this.showZoomLockNotice();
                
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');
                const yearDisplay = document.getElementById('year-display');
                const bounds = this.scenarioYearRanges[this.currentScenario];
                
                yearMinSlider.disabled = true;
                yearMaxSlider.disabled = true;
                yearMinSlider.value = bounds.min;
                yearMaxSlider.value = bounds.max;
                yearDisplay.textContent = 'All Years (Density Mode)';
                yearDisplay.classList.add('disabled');
                this.yearRange = null;
                this.updateSliderRange();
            } else {
                this.map.scrollWheelZoom.enable();
                this.map.doubleClickZoom.enable();
                this.map.touchZoom.enable();
                this.map.boxZoom.enable();
                this.map.keyboard.enable();
                
                this.map.zoomControl.addTo(this.map);
                
                if (this.previousZoom && this.previousCenter) {
                    this.map.setView(this.previousCenter, this.previousZoom, {
                        animate: true,
                        duration: 0.5
                    });
                }
                
                this.removeZoomLockNotice();
                
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');
                const yearDisplay = document.getElementById('year-display');
                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();
            }
            this.updateVisualization();
        });
        
        document.getElementById('show-tracks').addEventListener('change', (e) => {
            if (e.target.checked && (this.showHeatmap || this.showDensityHeatmap)) {
                document.getElementById('show-heatmap').checked = false;
                document.getElementById('show-density-heatmap').checked = false;
                this.showHeatmap = false;
                this.showDensityHeatmap = false;
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');
                const yearDisplay = document.getElementById('year-display');
                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();

                this.map.scrollWheelZoom.enable();
                this.map.doubleClickZoom.enable();
                this.map.touchZoom.enable();
                this.map.boxZoom.enable();
                this.map.keyboard.enable();
                
                this.map.zoomControl.addTo(this.map);
                
                if (this.previousZoom && this.previousCenter) {
                    this.map.setView(this.previousCenter, this.previousZoom, {
                        animate: true,
                        duration: 0.5
                    });
                }
                
                this.removeZoomLockNotice();
                
                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();
            }
            this.toggleLayer('tracks', e.target.checked);
            this.updateVisualization();
        });
        
        document.getElementById('show-genesis').addEventListener('change', (e) => {
            if (e.target.checked && (this.showHeatmap || this.showDensityHeatmap)) {
                document.getElementById('show-heatmap').checked = false;
                document.getElementById('show-density-heatmap').checked = false;
                this.showHeatmap = false;
                this.showDensityHeatmap = false;
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');
                const yearDisplay = document.getElementById('year-display');
                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();

                this.map.scrollWheelZoom.enable();
                this.map.doubleClickZoom.enable();
                this.map.touchZoom.enable();
                this.map.boxZoom.enable();
                this.map.keyboard.enable();
                
                this.map.zoomControl.addTo(this.map);
                
                if (this.previousZoom && this.previousCenter) {
                    this.map.setView(this.previousCenter, this.previousZoom, {
                        animate: true,
                        duration: 0.5
                    });
                }
                
                this.removeZoomLockNotice();
                
                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();
            }
            this.toggleLayer('genesis', e.target.checked);
            this.updateVisualization();
        });
        
        document.getElementById('show-intensity').addEventListener('change', (e) => {
            if (e.target.checked && (this.showHeatmap || this.showDensityHeatmap)) {
                document.getElementById('show-heatmap').checked = false;
                document.getElementById('show-density-heatmap').checked = false;
                this.showHeatmap = false;
                this.showDensityHeatmap = false;
                const yearMinSlider = document.getElementById('year-slider-min');
                const yearMaxSlider = document.getElementById('year-slider-max');
                const yearDisplay = document.getElementById('year-display');
                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();

                this.map.scrollWheelZoom.enable();
                this.map.doubleClickZoom.enable();
                this.map.touchZoom.enable();
                this.map.boxZoom.enable();
                this.map.keyboard.enable();
                
                this.map.zoomControl.addTo(this.map);
                
                if (this.previousZoom && this.previousCenter) {
                    this.map.setView(this.previousCenter, this.previousZoom, {
                        animate: true,
                        duration: 0.5
                    });
                }
                
                this.removeZoomLockNotice();

                yearMinSlider.disabled = false;
                yearMaxSlider.disabled = false;
                yearDisplay.classList.remove('disabled');
                this.updateYearDisplay();
            }
            this.toggleLayer('intensity', e.target.checked);
            this.updateVisualization();
        });
        
        document.getElementById('filter-australia').addEventListener('change', (e) => {
            this.filterAustralia = e.target.checked;
            this.loadData();
        });
        
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        yearMinSlider.addEventListener('input', (e) => {
            this.lastChangedSlider = 'min';
            updateYearRange();
        });
        
        yearMaxSlider.addEventListener('input', (e) => {
            this.lastChangedSlider = 'max';
            updateYearRange();
        });

        this.updateSliderRange();

        const updateYearRange = () => {
            if (yearMinSlider.disabled) {
                return;
            }
            
            let min = parseInt(yearMinSlider.value);
            let max = parseInt(yearMaxSlider.value);
            
            const bounds = this.scenarioYearRanges[this.currentScenario];
            
            min = Math.max(bounds.min, Math.min(bounds.max, min));
            max = Math.max(bounds.min, Math.min(bounds.max, max));
            
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
            
            if (min === bounds.min && max === bounds.max) {
                yearDisplay.textContent = `${bounds.min} - ${bounds.max}`;
                this.yearRange = null;
            } else if (min === max) {
                yearDisplay.textContent = `Year: ${min}`;
                this.yearRange = { min: min, max: max };
            } else {
                yearDisplay.textContent = `${min} - ${max}`;
                this.yearRange = { min: min, max: max };
            }
            
            this.updateVisualization();
        };

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadData(true);
        });
        
    }
    
    updateSliderRange() {
        const minSlider = document.getElementById('year-slider-min');
        const maxSlider = document.getElementById('year-slider-max');
        const sliderRange = document.querySelector('.slider-range');
        
        const min = parseInt(minSlider.value);
        const max = parseInt(maxSlider.value);
        const sliderMin = parseInt(minSlider.min);
        const sliderMax = parseInt(minSlider.max);
        
        const minPercent = ((min - sliderMin) / (sliderMax - sliderMin)) * 100;
        const maxPercent = ((max - sliderMin) / (sliderMax - sliderMin)) * 100;
        
        sliderRange.style.left = `${minPercent}%`;
        sliderRange.style.width = `${maxPercent - minPercent}%`;
    }

    handleScenarioChange(e) {
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        this.currentScenario = e.target.dataset.scenario;
        
        this.updateEnsembleSelector();
        
        this.updateYearSlider();
        
        this.loadData();
    }
    
    updateEnsembleSelector() {
        const ensembleInfo = document.getElementById('ensemble-info');
        const ensembleSelect = document.getElementById('ensemble-select');
        const sstSelector = document.getElementById('sst-selector');
        
        const ensembleLimits = {
            'current': { max: 100, available: 100, note: '(1-100 available)' },
            '2k': { max: 9, available: 9, note: '(101-109 on server)' },
            '4k': { max: 15, available: 15, note: '(101-115 on server)' }
        };
        
        const limit = ensembleLimits[this.currentScenario];
        
        ensembleInfo.textContent = limit.note;
        
        if (this.currentScenario === '2k' || this.currentScenario === '4k') {
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
            this.currentEnsemble = 1;
        }
    }
    
    updateYearSlider() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        const bounds = this.scenarioYearRanges[this.currentScenario];
        
        yearMinSlider.min = bounds.min;
        yearMinSlider.max = bounds.max;
        yearMinSlider.value = bounds.min;
        
        yearMaxSlider.min = bounds.min;
        yearMaxSlider.max = bounds.max;
        yearMaxSlider.value = bounds.max;
        
        yearDisplay.textContent = `${bounds.min} - ${bounds.max}`;
        this.yearRange = null;
        
        this.updateSliderRange();
    }
    
    updateYearDisplay() {
        const yearMinSlider = document.getElementById('year-slider-min');
        const yearMaxSlider = document.getElementById('year-slider-max');
        const yearDisplay = document.getElementById('year-display');
        
        if (this.showDensityHeatmap) {
            yearDisplay.textContent = 'All Years (Density Mode)';
        } else {
            const bounds = this.scenarioYearRanges[this.currentScenario];
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
    
    toggleLayer(layerName, visible) {
        if (layerName === 'heatmap') {
            if (visible && this.layers.heatmap) {
                this.layers.heatmap.addTo(this.map);
            } else if (!visible && this.layers.heatmap) {
                this.map.removeLayer(this.layers.heatmap);
            }
        } else {
            if (visible) {
                this.layers[layerName].addTo(this.map);
            } else {
                this.map.removeLayer(this.layers[layerName]);
            }
        }
    }
    
    isInAustralianRegion(lat, lon) {
        return lat >= -45 && lat <= -5 && lon >= 105 && lon <= 160;
    }

    calculateHeatmapRadius(zoom) {
        const baseRadius = 30;
        const baseZoom = 4;
        
        const zoomDiff = zoom - baseZoom;
        const scaleFactor = Math.pow(2, zoomDiff);
        
        const radius = baseRadius * scaleFactor;
        return Math.max(15, Math.min(200, radius));
    }

    calculateHeatmapBlur(zoom) {
        const baseBlur = 20;
        const baseZoom = 4;
        
        const zoomDiff = zoom - baseZoom;
        const scaleFactor = Math.pow(1.5, zoomDiff);
        
        const blur = baseBlur * scaleFactor;
        
        return Math.max(10, Math.min(50, blur));
    }

    redrawHeatmap() {
        if (!this.heatmapData || this.heatmapData.length === 0) return;
        
        if (this.layers.heatmap) {
            this.map.removeLayer(this.layers.heatmap);
        }
        
        const currentZoom = this.map.getZoom();
        const radius = this.calculateHeatmapRadius(currentZoom);
        const blur = this.calculateHeatmapBlur(currentZoom);
        
        this.layers.heatmap = L.heatLayer(this.heatmapData, {
            radius: radius,
            blur: blur,
            maxZoom: 17,
            max: 1.0,
            gradient: this.heatmapGradient,
            minOpacity: 0.2
        });
        
        this.layers.heatmap.addTo(this.map);
    }
    
    createDensityHeatmap(cyclones) {
        //TODO i dont exactly like how this turns out. need to have a deeper tweak
        if (this.layers.heatmap) {
            this.map.removeLayer(this.layers.heatmap);
        }

        this.layers.tracks.clearLayers();
        this.layers.genesis.clearLayers();
        this.layers.intensity.clearLayers();

        const heatData = [];
        const gridSize = 1.0; 
        const densityGrid = {};
        
        let yearMin, yearMax;
        if (this.currentScenario === 'current') {
            yearMin = 1951;
            yearMax = 2011;
        } else if (this.currentScenario === '2k') {
            yearMin = 2031;
            yearMax = 2090;
        } else if (this.currentScenario === '4k') {
            yearMin = 2051;
            yearMax = 2110;
        }
        const totalYears = yearMax - yearMin + 1;
        
        cyclones.forEach(cyclone => {
            if (!cyclone.track || cyclone.track.length === 0) return;
            
            if (cyclone.maxCategory < 1) return;
            
            const visitedCells = new Set();
            
            cyclone.track.forEach(point => {
                if (this.filterAustralia && !this.isInAustralianRegion(point.lat, point.lon)) {
                    return;
                }
                
                if (point.category < 1) return;
                
                const gridLat = Math.floor(point.lat / gridSize) * gridSize;
                const gridLon = Math.floor(point.lon / gridSize) * gridSize;
                const cellKey = `${gridLat},${gridLon}`;
                
                const cycloneCellKey = `${cyclone.id}_${cellKey}`;
                if (!visitedCells.has(cycloneCellKey)) {
                    visitedCells.add(cycloneCellKey);
                    
                    if (!densityGrid[cellKey]) {
                        densityGrid[cellKey] = {
                            lat: gridLat + gridSize / 2,
                            lon: gridLon + gridSize / 2,
                            count: 0
                        };
                    }
                    densityGrid[cellKey].count++;
                }
            });
        });
        
        let maxDensity = 0;
        Object.values(densityGrid).forEach(cell => {
            const annualDensity = cell.count / totalYears;
            maxDensity = Math.max(maxDensity, annualDensity);
            
            heatData.push([cell.lat, cell.lon, annualDensity]);
            
            const offset = gridSize / 3;
            const surroundingOffsets = [
                [offset, 0], [-offset, 0], [0, offset], [0, -offset],
                [offset, offset], [-offset, offset], [offset, -offset], [-offset, -offset]
            ];
            
            surroundingOffsets.forEach(([latOff, lonOff]) => {
                heatData.push([cell.lat + latOff, cell.lon + lonOff, annualDensity * 0.7]);
            });
        });
        
        //TODO maybe tweak colours?
        const gradient = {
            0.0: 'rgba(255, 255, 255, 0)',
            0.1: 'rgba(254, 235, 226, 0.6)',
            0.2: 'rgba(252, 197, 192, 0.7)',
            0.3: 'rgba(250, 159, 181, 0.8)',
            0.4: 'rgba(247, 104, 161, 0.85)',
            0.5: 'rgba(221, 52, 151, 0.9)',
            0.6: 'rgba(174, 1, 126, 0.95)',
            0.8: 'rgba(122, 1, 119, 1)',
            1.0: 'rgba(73, 0, 106, 1)'
        };
        
        const currentZoom = this.map.getZoom();
        const baseRadius = 40;
        const radius = baseRadius * Math.pow(2, (currentZoom - 4) * 0.5);
        const blur = 20 + (currentZoom - 4) * 2;
        
        this.layers.heatmap = L.heatLayer(heatData, {
            radius: Math.min(100, Math.max(20, radius)),
            blur: Math.min(35, Math.max(15, blur)),
            maxZoom: 17,
            max: maxDensity > 0 ? maxDensity : 1,
            gradient: gradient,
            minOpacity: 0.4
        });
        
        this.layers.heatmap.addTo(this.map);
        
        this.heatmapConfig = {
            baseRadius: baseRadius,
            data: heatData,
            gradient: gradient,
            maxValue: maxDensity
        };
        
        this.updateDensityLegend(maxDensity, totalYears);
        
        const comparisonPanel = document.getElementById('scenario-comparison');
        if (comparisonPanel) {
            comparisonPanel.classList.add('active');
            
            const metrics = this.calculateDensityMetrics(cyclones, totalYears);
            this.updateDensityComparisonPanel(metrics);
        }
    }
    
    calculateDensityMetrics(cyclones, totalYears) {
        const cat1Plus = cyclones.filter(c => c.maxCategory >= 1).length;
        const avgPerYear = (cat1Plus / totalYears).toFixed(2);
        
        const genesisCounts = {};
        cyclones.forEach(cyclone => {
            if (cyclone.maxCategory >= 1) {
                const lat = Math.floor(cyclone.genesis_lat / 5) * 5;
                const lon = Math.floor(cyclone.genesis_lon / 5) * 5;
                const key = `${lat},${lon}`;
                genesisCounts[key] = (genesisCounts[key] || 0) + 1;
            }
        });
        
        const maxGenesisCount = Math.max(...Object.values(genesisCounts), 0);
        const avgGenesisPerCell = Object.values(genesisCounts).reduce((a, b) => a + b, 0) / Object.keys(genesisCounts).length || 0;
        
        return {
            totalCat1Plus: cat1Plus,
            avgPerYear: avgPerYear,
            maxGenesisCount: maxGenesisCount,
            avgGenesisPerCell: avgGenesisPerCell.toFixed(2),
            totalYears: totalYears
        };
    }
    
    updateDensityLegend(maxDensity) {
        let densityLegend = document.getElementById('density-legend');
        if (!densityLegend) {
            densityLegend = document.createElement('div');
            densityLegend.id = 'density-legend';
            densityLegend.className = 'legend-box';
            document.getElementById('legend').appendChild(densityLegend);
        }
        
        const scenarioInfo = {
            'current': 'Historical Baseline (1951-2011)',
            '2k': '+2K Warming Scenario (2031-2090)',
            '4k': '+4K Warming Scenario (2051-2110)'
        };
        
        const legendValues = [0, 0.25, 0.5, 0.75, 1.0].map(v => (v * maxDensity).toFixed(2));
        
        densityLegend.innerHTML = `
            <h4>TC Density (Cat 1+/year)</h4>
            <p style="font-size: 12px; margin: 5px 0;">${scenarioInfo[this.currentScenario]}</p>
            <div class="heatmap-gradient">
                <div class="gradient-bar" style="background: linear-gradient(to right, 
                    rgba(255, 255, 255, 0) 0%,
                    rgba(254, 235, 226, 0.8) 10%,
                    rgba(252, 197, 192, 0.9) 20%,
                    rgba(250, 159, 181, 0.95) 35%,
                    rgba(247, 104, 161, 1) 50%,
                    rgba(221, 52, 151, 1) 65%,
                    rgba(174, 1, 126, 1) 80%,
                    rgba(122, 1, 119, 1) 90%,
                    rgba(73, 0, 106, 1) 100%
                );"></div>
                <div class="gradient-labels">
                    <span>0</span>
                    <span>${legendValues[1]}</span>
                    <span>${legendValues[2]}</span>
                    <span>${legendValues[3]}</span>
                    <span>${legendValues[4]}</span>
                </div>
            </div>
            <p style="font-size: 11px; margin-top: 10px; font-style: italic;">
                Annual density of Category 1+ cyclones.<br>
                Compare scenarios to see spatial shifts.
            </p>
        `;
        
        densityLegend.style.display = this.showDensityHeatmap ? 'block' : 'none';
        
        const heatmapLegend = document.getElementById('heatmap-legend');
        if (heatmapLegend) {
            heatmapLegend.style.display = 'none';
        }
    }
    
    updateDensityComparisonPanel(metrics) {
        const panel = document.getElementById('scenario-comparison');
        if (!panel) return;
        
        const content = document.getElementById('comparison-content');
        
        panel.classList.add('active');
        
        content.innerHTML = `
            <div class="comparison-item">
                <div class="scenario-label">${this.currentScenario === 'current' ? 'Historical' : '+' + this.currentScenario.toUpperCase() + ' Warming'}</div>
                <div class="metric">Period: ${metrics.totalYears} years</div>
                <div class="metric">Cat 1+ Cyclones: ${metrics.totalCat1Plus}</div>
                <div class="metric">Average per Year: ${metrics.avgPerYear}</div>
                <div class="metric">Peak Genesis Density: ${metrics.maxGenesisCount}</div>
                <div class="metric">Avg Genesis per Cell: ${metrics.avgGenesisPerCell}</div>
            </div>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
                ${this.getDensityScenarioInsight()}
            </p>
        `;
    }
    
    getDensityScenarioInsight() {
        const insights = {
            'current': 'Historical cyclone density patterns showing natural distribution.',
            '2k': 'Moderate warming shows shifts in cyclone density and genesis regions.',
            '4k': 'Severe warming reveals significant changes in spatial cyclone distribution.'
        };
        return insights[this.currentScenario] || '';
    }
    
    createHeatmap(cyclones) {
        if (this.layers.heatmap) {
            this.map.removeLayer(this.layers.heatmap);
        }

        this.layers.tracks.clearLayers();
        this.layers.genesis.clearLayers();
        this.layers.intensity.clearLayers();

        const heatData = [];
        
        const currentZoom = this.map.getZoom();
        const zoomFactor = Math.pow(1.5, currentZoom - 4);
        
        cyclones.forEach(cyclone => {
            if (!cyclone.track || cyclone.track.length === 0) return;

            for (let i = 0; i < cyclone.track.length; i++) {
                const point = cyclone.track[i];

                if (this.filterAustralia && !this.isInAustralianRegion(point.lat, point.lon)) {
                    continue;
                }

                const category = point.category || cyclone.maxCategory || 1;
                const weight = Math.pow(category / 5, 1.5);
                
                heatData.push([point.lat, point.lon, weight]);
                
                if (i < cyclone.track.length - 1) {
                    const nextPoint = cyclone.track[i + 1];
                    
                    const latDiff = Math.abs(nextPoint.lat - point.lat);
                    const lonDiff = Math.abs(nextPoint.lon - point.lon);
                    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                    
                    if (distance < 5) { // Only interpolate if points are reasonably close
                        // Number of interpolation points based on distance and zoom
                        const interpPoints = Math.min(5, Math.ceil(distance * zoomFactor));
                        
                        for (let j = 1; j < interpPoints; j++) {
                            const t = j / interpPoints;
                            const interpLat = point.lat + (nextPoint.lat - point.lat) * t;
                            const interpLon = point.lon + (nextPoint.lon - point.lon) * t;
                            
                            heatData.push([interpLat, interpLon, weight * 0.8]);
                        }
                    }
                }
                
                const spread = 0.2 / zoomFactor; 
                const angles = [0, 90, 180, 270]; 
                
                angles.forEach(angle => {
                    const rad = angle * Math.PI / 180;
                    const offsetLat = point.lat + spread * Math.cos(rad);
                    const offsetLon = point.lon + spread * Math.sin(rad);
                    heatData.push([offsetLat, offsetLon, weight * 0.5]);
                });
            }
        });
        
        // these need fixing, i dont like the scale
        const gradient = {
            0.0: 'rgba(255, 255, 200, 0.0)',
            0.1: 'rgba(255, 255, 100, 0.3)',
            0.2: 'rgba(255, 255, 0, 0.5)',
            0.5: 'rgba(255, 220, 0, 0.6)',
            0.62: 'rgba(255, 165, 0, 0.7)',
            0.7: 'rgba(255, 69, 0, 0.8)',
            0.85: 'rgba(255, 0, 0, 0.9)',
            0.95: 'rgba(139, 0, 0, 0.95)',
            1.0: 'rgba(0, 0, 0, 1.0)'
        };
        
        //i tried to fix breaking of points with zoom, hasnt quite worked but hey its better
        const baseRadius = 25;
        const radius = baseRadius * Math.pow(2, (currentZoom - 4) * 0.7);
        const blur = 15 + (currentZoom - 4) * 3;

        this.layers.heatmap = L.heatLayer(heatData, {
            radius: Math.min(80, Math.max(15, radius)), 
            blur: Math.min(40, Math.max(10, blur)),     
            maxZoom: 17,
            max: 1.0,
            gradient: gradient,
            minOpacity: 0.3
        });
        
        this.layers.heatmap.addTo(this.map);

        this.heatmapConfig = {
            baseRadius: baseRadius,
            data: heatData,
            gradient: gradient
        };

        this.updateHeatmapLegend();

        //honestly this should just display all the time
        const comparisonPanel = document.getElementById('scenario-comparison');
        if (comparisonPanel) {
            comparisonPanel.classList.add('active');
            
            const metrics = this.calculateIntensityMetrics(cyclones);
            this.updateComparisonPanel(metrics);
        }
    }
    
    async loadData(forceRefresh = false) {
        this.showLoading(true);
        this.updateDataStatus('Loading data...');
        
        try {
            const cacheKey = this.currentScenario === 'current' 
                ? `${this.currentScenario}_${this.currentEnsemble}`
                : `${this.currentScenario}_${this.currentEnsemble}_${this.currentSSTModel}`;
            
            if (!forceRefresh && this.cycloneData[cacheKey]) {
                this.updateVisualization();
                this.showLoading(false);
                return;
            }
        
            
            const params = new URLSearchParams({
                action: 'getCycloneData',
                scenario: this.currentScenario,
                ensemble: this.currentEnsemble,
                filter: this.filterAustralia ? 'australia' : 'all',
                use_sample: 'false',
                debug: 'true' 
            });
            
            if (this.currentScenario === '2k' || this.currentScenario === '4k') {
                params.append('sst', this.currentSSTModel);
            }
            
            console.log(`Fetching data with params:`, params.toString());
            
            const response = await fetch(`api.php?${params}`);
            const data = await response.json();
            
            console.log('API Response:', data);
            
            if (data.success) {
                this.cycloneData[cacheKey] = data.data;
                this.updateVisualization();
                this.showDataInfo(data.data);
            } else {
                console.error('Failed to load data:', data.error);
                this.updateDataStatus('Failed to load data', 'error');
                alert('Failed to load cyclone data. The data file may not be available on the server.');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.updateDataStatus('Error loading data', 'error');
            alert('Error loading data. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }
    
    updateDataStatus(message, type = 'info') {
        const statusEl = document.getElementById('data-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? '#e74c3c' : 
                                  type === 'success' ? '#27ae60' : '#7f8c8d';
        }
    }
    
    showDataInfo(data) {
        const metadata = data.metadata;
        console.log(`Loaded ${data.cyclones.length} cyclones for ${metadata.description}`);
        console.log(`Period: ${metadata.period}, Ensemble: ${data.ensemble_id}`);
        
        let statusMsg = `Loaded ${data.cyclones.length} cyclones`;
        if (data.total_cyclones && data.total_cyclones > data.cyclones.length) {
            statusMsg += ` (filtered from ${data.total_cyclones})`;
        }
        
        this.updateDataStatus(statusMsg, 'success');
    }
    
    updateVisualization() {        
        this.layers.tracks.clearLayers();
        this.layers.genesis.clearLayers();
        this.layers.intensity.clearLayers();
        
        if (this.layers.heatmap) {
            this.map.removeLayer(this.layers.heatmap);
            this.layers.heatmap = null;
        }
        
        this.heatmapConfig = null;
        
        const cacheKey = this.currentScenario === 'current' 
            ? `${this.currentScenario}_${this.currentEnsemble}`
            : `${this.currentScenario}_${this.currentEnsemble}_${this.currentSSTModel}`;
        const data = this.cycloneData[cacheKey];
        if (!data || !data.cyclones) return;
        
        let cyclones = data.cyclones;
        

        if (!this.showDensityHeatmap && this.yearRange) {
            cyclones = cyclones.filter(c => 
                c.year >= this.yearRange.min && c.year <= this.yearRange.max
            );
        }
        
        const heatmapCheckbox = document.getElementById('show-heatmap');
        const densityCheckbox = document.getElementById('show-density-heatmap');
        const isHeatmapMode = heatmapCheckbox && heatmapCheckbox.checked;
        const isDensityMode = densityCheckbox && densityCheckbox.checked;
        this.showHeatmap = isHeatmapMode;
        this.showDensityHeatmap = isDensityMode;

        const comparisonPanel = document.getElementById('scenario-comparison');
        if (comparisonPanel) {
            comparisonPanel.classList.remove('active');
        }
        
        const heatmapLegend = document.getElementById('heatmap-legend');
        const densityLegend = document.getElementById('density-legend');
        if (heatmapLegend) heatmapLegend.style.display = 'none';
        if (densityLegend) densityLegend.style.display = 'none';
        
        if (isDensityMode) {
            this.createDensityHeatmap(cyclones);
            document.getElementById('map').classList.add('heatmap-active');
        } else if (isHeatmapMode) {
            this.createHeatmap(cyclones);
            document.getElementById('map').classList.add('heatmap-active');
        } else {
            document.getElementById('map').classList.remove('heatmap-active');
            
            const showTracks = document.getElementById('show-tracks').checked;
            const showGenesis = document.getElementById('show-genesis').checked;
            const showIntensity = document.getElementById('show-intensity').checked;
            
            cyclones.forEach(cyclone => {
                if (showTracks) {
                    this.drawCycloneTrack(cyclone);
                }
                if (showGenesis) {
                    this.drawGenesisPoint(cyclone);
                }
                if (showIntensity) {
                    this.drawIntensityTrack(cyclone);
                }
            });
        }
        
        const displayMode = isDensityMode ? 'density heatmap' : (isHeatmapMode ? 'severity heatmap' : 'tracks');
        console.log(`Showing ${cyclones.length} cyclones in ${displayMode} mode`);
    }
    
    showZoomLockNotice() {
        if (!document.getElementById('zoom-lock-notice')) {
            const notice = document.createElement('div');
            notice.id = 'zoom-lock-notice';
            notice.className = 'zoom-lock-notice';
            notice.innerHTML = `
                <div class="notice-content">
                    <span class="notice-icon">🔒</span>
                    <span>Zoom is locked in heatmap view for optimal visualization</span>
                </div>
            `;
            document.getElementById('map').appendChild(notice);
        }
    }

    removeZoomLockNotice() {
        const notice = document.getElementById('zoom-lock-notice');
        if (notice) {
            notice.remove();
        }
    }

    drawCycloneTrack(cyclone) {
        if (!cyclone.track || cyclone.track.length < 2) return;
        
        const latlngs = cyclone.track.map(point => [point.lat, point.lon]);
        
        const polyline = L.polyline(latlngs, {
            color: this.getTrackColor(cyclone.maxCategory),
            weight: 2,
            opacity: 0.7
        });
        
        polyline.on('click', () => this.showCycloneInfo(cyclone));
        
        this.layers.tracks.addLayer(polyline);
    }
    
    drawGenesisPoint(cyclone) {
        if (!cyclone.track || cyclone.track.length === 0) return;
        
        const genesis = cyclone.track[0];
        const marker = L.circleMarker([genesis.lat, genesis.lon], {
            radius: 6,
            fillColor: '#e74c3c',
            color: 'white',
            weight: 2,
            fillOpacity: 0.8
        });
        
        marker.bindPopup(`<strong>${cyclone.name}</strong><br>Genesis: ${genesis.date}<br>Year: ${cyclone.year}`);
        
        this.layers.genesis.addLayer(marker);
    }
    
    drawIntensityTrack(cyclone) {
        if (!cyclone.track || cyclone.track.length < 2) return;
        
        for (let i = 0; i < cyclone.track.length - 1; i++) {
            const start = cyclone.track[i];
            const end = cyclone.track[i + 1];
            
            const segment = L.polyline(
                [[start.lat, start.lon], [end.lat, end.lon]], 
                {
                    color: this.getIntensityColor(start.category),
                    weight: 4,
                    opacity: 0.8
                }
            );
            
            this.layers.intensity.addLayer(segment);
        }
    }
    
    getTrackColor(category) {
        const colors = {
            0: '#999999', 
            1: '#1f78b4',
            2: '#33a02c',
            3: '#ff7f00',
            4: '#e31a1c',
            5: '#6a3d9a'
        };
        return colors[category] || '#666666';
    }
    
    getIntensityColor(category) {
        return this.getTrackColor(category);
    }
    
    showCycloneInfo(cyclone) {
        const infoPanel = document.getElementById('info-panel');
        const details = document.getElementById('cyclone-details');
        
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
    
    exportData() {
        const cacheKey = this.currentScenario === 'current' 
            ? `${this.currentScenario}_${this.currentEnsemble}`
            : `${this.currentScenario}_${this.currentEnsemble}_${this.currentSSTModel}`;
        const data = this.cycloneData[cacheKey];
        if (!data || !data.cyclones) {
            alert('No data to export');
            return;
        }
        
        let cyclones = data.cyclones;
        if (this.yearRange) {
            cyclones = cyclones.filter(c => c.year === this.yearRange);
        }
        
        let csv = 'ID,Name,Year,Genesis Month,Max Category,Max Wind (km/h),Min Pressure (hPa),Duration (days),Genesis Lat,Genesis Lon,Landfall\n';
        
        cyclones.forEach(cyclone => {
            csv += `${cyclone.id},${cyclone.name},${cyclone.year},${cyclone.genesis_month || 'N/A'},${cyclone.maxCategory},${cyclone.maxWind},${cyclone.minPressure},${cyclone.duration_days || cyclone.duration},${cyclone.genesis_lat},${cyclone.genesis_lon},${cyclone.landfall ? 'Yes' : 'No'}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = `cyclone_data_${this.currentScenario}_ensemble${this.currentEnsemble}`;
        if (this.currentScenario === '2k' || this.currentScenario === '4k') {
            filename += `_${this.currentSSTModel}`;
        }
        filename += `_${new Date().toISOString().split('T')[0]}.csv`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    createComparisonPanel() {
        if (!document.getElementById('scenario-comparison')) {
            const panel = document.createElement('div');
            panel.id = 'scenario-comparison';
            panel.className = 'scenario-comparison';
            panel.innerHTML = `
                <h4>Scenario Comparison</h4>
                <div id="comparison-content">
                    <p style="font-size: 12px; color: #666;">
                        Switch between scenarios to compare TC severity patterns
                    </p>
                </div>
            `;
            document.getElementById('map').appendChild(panel);
        }
    }
    
    updateHeatmapLegend() {
        let heatmapLegend = document.getElementById('heatmap-legend');
        if (!heatmapLegend) {
            heatmapLegend = document.createElement('div');
            heatmapLegend.id = 'heatmap-legend';
            heatmapLegend.className = 'legend-box';
            document.getElementById('legend').appendChild(heatmapLegend);
        }
        
        const scenarioInfo = {
            'current': 'Historical Baseline (1951-2011)',
            '2k': '+2K Warming Scenario',
            '4k': '+4K Warming Scenario'
        };
        
        heatmapLegend.innerHTML = `
            <h4>TC Severity Heatmap</h4>
            <p style="font-size: 12px; margin: 5px 0;">${scenarioInfo[this.currentScenario]}</p>
            <div class="heatmap-gradient">
                <div class="gradient-bar"></div>
                <div class="gradient-labels">
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                    <span>Extreme</span>
                </div>
            </div>
            <p style="font-size: 11px; margin-top: 10px; font-style: italic;">
                Colors show average cyclone severity.<br>
                Compare scenarios to see warming impact.
            </p>
        `;
        
        heatmapLegend.style.display = this.showHeatmap ? 'block' : 'none';
    }
    
    calculateIntensityMetrics(cyclones) {
        const metrics = {
            totalCyclones: cyclones.length,
            severeCyclones: 0,
            avgMaxCategory: 0,
            maxWindSpeed: 0,
            landfallCount: 0
        };
        
        let totalCategory = 0;
        
        cyclones.forEach(cyclone => {
            if (cyclone.maxCategory >= 3) {
                metrics.severeCyclones++;
            }
            totalCategory += cyclone.maxCategory || 0;
            metrics.maxWindSpeed = Math.max(metrics.maxWindSpeed, cyclone.maxWind || 0);
            if (cyclone.landfall) {
                metrics.landfallCount++;
            }
        });
        
        metrics.avgMaxCategory = cyclones.length > 0 ? (totalCategory / cyclones.length).toFixed(1) : 0;
        
        return metrics;
    }
    
    updateComparisonPanel(metrics) {
        const panel = document.getElementById('scenario-comparison');
        if (!panel) return;
        
        const content = document.getElementById('comparison-content');
        
        panel.classList.add('active');
        
        content.innerHTML = `
            <div class="comparison-item">
                <div class="scenario-label">${this.currentScenario === 'current' ? 'Historical' : '+' + this.currentScenario.toUpperCase() + ' Warming'}</div>
                <div class="metric">Total Cyclones: ${metrics.totalCyclones}</div>
                <div class="metric">Severe (Cat 3+): ${metrics.severeCyclones} (${((metrics.severeCyclones/metrics.totalCyclones)*100).toFixed(1)}%)</div>
                <div class="metric">Avg Category: ${metrics.avgMaxCategory}</div>
                <div class="metric">Max Wind: ${metrics.maxWindSpeed} km/h</div>
                <div class="metric">Landfalls: ${metrics.landfallCount}</div>
            </div>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
                ${this.getScenarioInsight()}
            </p>
        `;
    }
    
    getScenarioInsight() {
        const insights = {
            'current': 'Historical baseline period showing natural cyclone patterns.',
            '2k': 'Moderate warming scenario shows increased intensity in key regions.',
            '4k': 'Severe warming scenario displays significant intensification and expanded severe cyclone zones.'
        };
        return insights[this.currentScenario] || '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TCVisualization();
});