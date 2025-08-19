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
        this.heatmapRequestId = 0;
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
                if ((this.showHeatmap || this.showDensityHeatmap) && this.heatmapConfig && this.layers.heatmap) {
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
        this.updateVisualization();
    }

async fetchPrecomputedDensity(scenario, ensemble, sstModel) {
    try {
        let filename = 'density_data/';
        
        switch(scenario) {
            case 'current':
                // Historical: density_HPB_m001_1951-2011.txt
                const ensembleNumCurrent = String(ensemble).padStart(3, '0');
                filename += `density_HPB_m${ensembleNumCurrent}_1951-2011.txt`;
                break;
                
            case '2k':
                // 2K warming: density_HFB_2K_CC_m101_2031-2090.txt
                // Ensemble IDs for 2K start at 101
                const ensembleNum2K = 100 + ensemble;
                const ensembleStr2K = String(ensembleNum2K).padStart(3, '0');
                const sst2K = sstModel || 'CC';
                filename += `density_HFB_2K_${sst2K}_m${ensembleStr2K}_2031-2090.txt`;
                break;
                
            case '4k':
                // 4K warming: density_HFB_4K_CC_m101_2051-2110.txt
                // Ensemble IDs for 4K start at 101
                const ensembleNum4K = 100 + ensemble;
                const ensembleStr4K = String(ensembleNum4K).padStart(3, '0');
                const sst4K = sstModel || 'CC';
                filename += `density_HFB_4K_${sst4K}_m${ensembleStr4K}_2051-2110.txt`;
                break;
                
            default:
                throw new Error(`Unknown scenario: ${scenario}`);
        }
        
        console.log(`Fetching pre-computed density data from: ${filename}`);
        
        const response = await fetch(filename);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch density data: ${response.status} - ${filename}`);
        }
        
        const text = await response.text();
        const data = this.parseDensityCSV(text);
        
        console.log(`Successfully loaded ${data.length} density cells from ${filename}`);
        return data;
        
    } catch (error) {
        console.error('Failed to fetch pre-computed density data:', error);
        
        const errorMsg = `Could not load pre-computed density data for ${scenario} scenario, ensemble ${ensemble}${sstModel ? ', SST model ' + sstModel : ''}. Falling back to computed heatmap aborted: DEPRECATED.`;
        console.warn(errorMsg);
        
        this.showNotification(errorMsg, 'warning');
        
        return null;
    }
}

showNotification(message, type = 'info') {
    let notification = document.getElementById('density-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'density-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 5000);
}

parseDensityCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue; // Skip malformed lines
        
        const row = {};
        headers.forEach((header, index) => {
            const value = values[index];
            // Parse numbers
            if (['ix', 'iy', 'count'].includes(header.trim())) {
                row[header.trim()] = parseInt(value);
            } else if (['lon_west', 'lon_east', 'lat_south', 'lat_north', 'lon_center', 'lat_center'].includes(header.trim())) {
                row[header.trim()] = parseFloat(value);
            } else {
                row[header.trim()] = value;
            }
        });
        data.push(row);
    }
    
    console.log(`Parsed ${data.length} density cells from CSV`);
    return data;
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
        
        document.getElementById('show-heatmap').addEventListener('change', async (e) => {
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

                        this.showLoading(true);
                await this.updateVisualization();
        this.showLoading(false);
            } else {
                this.heatmapRequestId++; 
                this.clearHeatmapLayer();

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


    //TODO: This method is a WIP, requires expanding for full world and a slight check of track count displaying
    //NOTE: As of version 0.10.0 this has been superseded by the experimental heatmap tool.
createDensityHeatmap(cyclones) {
    // Clear existing layers
    if (this.layers.heatmap) {
        this.map.removeLayer(this.layers.heatmap);
    }
    this.layers.tracks.clearLayers();
    this.layers.genesis.clearLayers();
    this.layers.intensity.clearLayers();

    // Create GLOBAL grid with configurable resolution
    const gridResolution = 2; // degrees per cell (can be adjusted)
    this.gridResolution = gridResolution; // Store for use in legend
    const lonBins = [];
    const latBins = [];
    
    // Global coverage: -180 to 180 longitude, -90 to 90 latitude
    for (let lon = -180; lon <= 180; lon += gridResolution) {
        lonBins.push(lon);
    }
    for (let lat = -90; lat <= 90; lat += gridResolution) {
        latBins.push(lat);
    }
    
    // Initialize frequency grid
    const tcFreq = {};
    
    // Helper function to get grid cell key from coordinates
    const getCellKey = (lat, lon) => {
        // Handle longitude wrapping
        while (lon < -180) lon += 360;
        while (lon > 180) lon -= 360;
        
        const lonIdx = Math.floor((lon + 180) / gridResolution);
        const latIdx = Math.floor((lat + 90) / gridResolution);
        return `${latIdx},${lonIdx}`;
    };
    
    // Bresenham-like line algorithm to find all cells a line passes through
    const getLineCells = (lat1, lon1, lat2, lon2) => {
        const cells = new Set();
        
        // Handle longitude wrapping for shortest path
        let dLon = lon2 - lon1;
        if (Math.abs(dLon) > 180) {
            if (dLon > 0) {
                dLon = dLon - 360;
            } else {
                dLon = dLon + 360;
            }
        }
        lon2 = lon1 + dLon;
        
        // Convert to grid coordinates
        const x1 = (lon1 + 180) / gridResolution;
        const y1 = (lat1 + 90) / gridResolution;
        const x2 = (lon2 + 180) / gridResolution;
        const y2 = (lat2 + 90) / gridResolution;
        
        // Use a high-resolution sampling to ensure we don't miss any cells
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const steps = Math.max(Math.ceil(distance * 2), 2); // Sample at least twice per cell
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // Get the cell for this point
            const cellX = Math.floor(x);
            const cellY = Math.floor(y);
            
            // Also check adjacent cells to ensure we catch edge cases
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const checkX = cellX + dx;
                    const checkY = cellY + dy;
                    
                    // Check if this cell is actually crossed by the line segment
                    if (this.lineIntersectsCell(x1, y1, x2, y2, checkX, checkY, checkX + 1, checkY + 1)) {
                        // Convert back to lat/lon for the cell key
                        const cellLat = (checkY * gridResolution) - 90;
                        const cellLon = (checkX * gridResolution) - 180;
                        
                        // Ensure we're within valid bounds
                        if (cellLat >= -90 && cellLat < 90 && cellLon >= -180 && cellLon < 180) {
                            cells.add(getCellKey(cellLat, cellLon));
                        }
                    }
                }
            }
        }
        
        return cells;
    };
    
    // Helper function to check if a line segment intersects with a cell
    this.lineIntersectsCell = (x1, y1, x2, y2, cellMinX, cellMinY, cellMaxX, cellMaxY) => {
        // Check if either endpoint is inside the cell
        if ((x1 >= cellMinX && x1 < cellMaxX && y1 >= cellMinY && y1 < cellMaxY) ||
            (x2 >= cellMinX && x2 < cellMaxX && y2 >= cellMinY && y2 < cellMaxY)) {
            return true;
        }
        
        // Check if line segment intersects cell boundaries
        // Using line-box intersection algorithm
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        let tMin = 0;
        let tMax = 1;
        
        // Check intersection with vertical cell boundaries
        if (dx !== 0) {
            const tx1 = (cellMinX - x1) / dx;
            const tx2 = (cellMaxX - x1) / dx;
            
            tMin = Math.max(tMin, Math.min(tx1, tx2));
            tMax = Math.min(tMax, Math.max(tx1, tx2));
        } else if (x1 < cellMinX || x1 >= cellMaxX) {
            return false;
        }
        
        // Check intersection with horizontal cell boundaries
        if (dy !== 0) {
            const ty1 = (cellMinY - y1) / dy;
            const ty2 = (cellMaxY - y1) / dy;
            
            tMin = Math.max(tMin, Math.min(ty1, ty2));
            tMax = Math.min(tMax, Math.max(ty1, ty2));
        } else if (y1 < cellMinY || y1 >= cellMaxY) {
            return false;
        }
        
        return tMin <= tMax;
    };
    
    // Process each cyclone
    cyclones.forEach(cyclone => {
        if (!cyclone.track || cyclone.track.length === 0) return;
        
        const processedCells = new Set(); // Track which cells we've already counted for this cyclone
        
        for (let i = 0; i < cyclone.track.length; i++) {
            const point = cyclone.track[i];
            
            const pointCell = getCellKey(point.lat, point.lon);
            if (!processedCells.has(pointCell)) {
                processedCells.add(pointCell);
                tcFreq[pointCell] = (tcFreq[pointCell] || 0) + 1;
            }
            
            if (i < cyclone.track.length - 1) {
                const nextPoint = cyclone.track[i + 1];
                
                const latDiff = Math.abs(nextPoint.lat - point.lat);
                let lonDiff = Math.abs(nextPoint.lon - point.lon);
                if (lonDiff > 180) lonDiff = 360 - lonDiff; 
                
                if (latDiff < 20 && lonDiff < 20) { 
                    const lineCells = getLineCells(point.lat, point.lon, nextPoint.lat, nextPoint.lon);
                    
                    lineCells.forEach(cellKey => {
                        if (!processedCells.has(cellKey)) {
                            processedCells.add(cellKey);
                            tcFreq[cellKey] = (tcFreq[cellKey] || 0) + 1;
                        }
                    });
                }
            }
        }
    });
    
    const levels = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 75, 100];
    
    const colors = [
        'rgba(255, 255, 255, 0)',     // 0 - transparent
        'rgba(254, 254, 217, 0.7)',   // 1 - very pale yellow
        'rgba(254, 248, 195, 0.75)',  // 2 - pale yellow
        'rgba(254, 235, 162, 0.8)',   // 3 - light yellow
        'rgba(254, 217, 118, 0.85)',  // 4 - yellow
        'rgba(254, 196, 79, 0.85)',   // 5 - golden yellow
        'rgba(254, 173, 67, 0.9)',    // 7 - orange-yellow
        'rgba(252, 141, 60, 0.9)',    // 10 - light orange
        'rgba(248, 105, 51, 0.9)',    // 15 - orange
        'rgba(238, 75, 43, 0.95)',    // 20 - dark orange
        'rgba(220, 50, 32, 0.95)',    // 30 - orange-red
        'rgba(187, 21, 26, 0.95)',    // 50 - red
        'rgba(145, 0, 13, 1)',        // 75 - dark red
        'rgba(103, 0, 13, 1)'         // 100+ - darkest red
    ];
    
    const getColor = (count) => {
        for (let i = levels.length - 1; i >= 0; i--) {
            if (count >= levels[i]) {
                return colors[i];
            }
        }
        return colors[0];
    };
    
    const rectangles = [];
    
    Object.keys(tcFreq).forEach(cellKey => {
        const count = tcFreq[cellKey];
        if (count > 0) {
            const [latIdx, lonIdx] = cellKey.split(',').map(Number);
            
            const lat = (latIdx * gridResolution) - 90;
            const lon = (lonIdx * gridResolution) - 180;
            
            const bounds = [
                [lat, lon],
                [lat + gridResolution, lon + gridResolution]
            ];
            
            const rect = L.rectangle(bounds, {
                fillColor: getColor(count),
                fillOpacity: 0.8,
                weight: 0.5,
                color: 'rgba(100, 100, 100, 0.3)',
                interactive: true
            });
            
            rect.bindPopup(`
                <strong>TC Track Density</strong><br>
                Cell: ${lat.toFixed(1)}°, ${lon.toFixed(1)}°<br>
                Track Count: ${count}
            `);
            
            rectangles.push(rect);
        }
    });
    
    this.layers.heatmap = L.featureGroup(rectangles);
    this.layers.heatmap.addTo(this.map);
    
    this.updateDensityLegend(levels);
    const totalCells = Object.keys(tcFreq).length;
    const maxDensity = Math.max(...Object.values(tcFreq), 0);
    const totalPoints = Object.values(tcFreq).reduce((a, b) => a + b, 0);
    
    const metrics = {
        totalTrackPoints: totalPoints,
        activeCells: totalCells,
        maxCellDensity: maxDensity,
        avgDensity: totalCells > 0 ? (totalPoints / totalCells).toFixed(1) : 0,
        gridResolution: gridResolution
    };
    
    this.updateDensityComparisonPanel(metrics);
    
    console.log(`Density heatmap created: ${totalCells} active cells, max density: ${maxDensity}`);
}

    
updateDensityLegend(levels) {
    let densityLegend = document.getElementById('density-legend');
    if (!densityLegend) {
        densityLegend = document.createElement('div');
        densityLegend.id = 'density-legend';
        densityLegend.className = 'legend-box';
        document.getElementById('legend').appendChild(densityLegend);
    }
    
    const scenarioInfo = {
        'current': 'Historical (1951-2011)',
        '2k': '+2K Warming (2031-2090)',
        '4k': '+4K Warming (2051-2110)'
    };
    
    let legendHTML = `
        <h4>TC Track Density</h4>
        <p style="font-size: 12px; margin: 5px 0;">${scenarioInfo[this.currentScenario]}</p>
        <div class="density-legend-items">
    `;
    
    const colors = [
        'rgba(254, 254, 217, 1)',   // 1
        'rgba(254, 248, 195, 1)',   // 2
        'rgba(254, 235, 162, 1)',   // 3
        'rgba(254, 217, 118, 1)',   // 4
        'rgba(254, 196, 79, 1)',    // 5
        'rgba(254, 173, 67, 1)',    // 7
        'rgba(252, 141, 60, 1)',    // 10
        'rgba(248, 105, 51, 1)',    // 15
        'rgba(238, 75, 43, 1)',     // 20
        'rgba(220, 50, 32, 1)',     // 30
        'rgba(187, 21, 26, 1)',     // 50
        'rgba(145, 0, 13, 1)',      // 75
        'rgba(103, 0, 13, 1)'       // 100+
    ];
    
    const displayLevels = [
        { value: 100, color: colors[12], label: '100+' },
        { value: 75, color: colors[11], label: '75-99' },
        { value: 50, color: colors[10], label: '50-74' },
        { value: 30, color: colors[9], label: '30-49' },
        { value: 20, color: colors[8], label: '20-29' },
        { value: 15, color: colors[7], label: '15-19' },
        { value: 10, color: colors[6], label: '10-14' },
        { value: 7, color: colors[5], label: '7-9' },
        { value: 5, color: colors[4], label: '5-6' },
        { value: 4, color: colors[3], label: '4' },
        { value: 3, color: colors[2], label: '3' },
        { value: 2, color: colors[1], label: '2' },
        { value: 1, color: colors[0], label: '1' }
    ];
    
    displayLevels.forEach((level) => {
        legendHTML += `
            <div class="legend-item" style="margin: 2px 0; display: flex; align-items: center;">
                <span class="legend-color" style="background: ${level.color}; width: 25px; height: 14px; display: inline-block; border: 1px solid #999;"></span>
                <span style="font-size: 11px; margin-left: 6px; min-width: 40px;">${level.label}</span>
            </div>
        `;
    });
    
    legendHTML += `
        </div>
        <p style="font-size: 11px; margin-top: 10px; font-style: italic; color: #666;">
            Number of TC tracks per grid cell<br>
            (${this.gridResolution || 2}° × ${this.gridResolution || 2}° resolution)
        </p>
    `;
    
    densityLegend.innerHTML = legendHTML;
    densityLegend.style.display = this.showDensityHeatmap ? 'block' : 'none';
    
    const heatmapLegend = document.getElementById('heatmap-legend');
    if (heatmapLegend) {
        heatmapLegend.style.display = 'none';
    }
}

    
updateDensityComparisonPanel(metrics) {
    const content = document.getElementById('comparison-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="comparison-item">
            <div class="scenario-label">${this.currentScenario === 'current' ? 'Historical' : '+' + this.currentScenario.toUpperCase() + ' Warming'}</div>
            <div class="metric"><b>Active Cells:</b> ${metrics.totalCells}</div>
            <div class="metric"><b>Total Track Points:</b> ${metrics.totalTrackPoints}</div>
            <div class="metric"><b>Max Density:</b> ${metrics.maxDensity}</div>
            <div class="metric"><b>Avg Density:</b> ${metrics.avgDensity}</div>
            <hr style="margin: 8px 0;">
            <div class="metric" style="color: #8B0000;"><b>Severe (≥80):</b> ${metrics.severeCells} cells</div>
            <div class="metric" style="color: #FF4500;"><b>High (40-79):</b> ${metrics.highCells} cells</div>
            <div class="metric" style="color: #FFA500;"><b>Moderate (10-39):</b> ${metrics.moderateCells} cells</div>
            <div class="metric" style="color: #FFD700;"><b>Low (1-9):</b> ${metrics.lowCells} cells</div>
        </div>
        <p style="font-size: 11px; color: #666; margin-top: 10px;">
            Density computed from d4PDF track data<br>
            Grid: 2° lon × 3° lat resolution
        </p>
    `;
}

async createHeatmap(cyclones) {
    const reqId = ++this.heatmapRequestId;

    if (this.layers.heatmap) {
        this.map.removeLayer(this.layers.heatmap);
        this.layers.heatmap = null;
    }
    
    this.layers.tracks.clearLayers();
    this.layers.genesis.clearLayers();
    this.layers.intensity.clearLayers();
    
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) {
        const loadingText = loadingEl.querySelector('p');
        if (loadingText) {
            loadingText.textContent = 'Loading pre-computed density heatmap...';
        }
    }
    
    const densityData = await this.fetchPrecomputedDensity(
        this.currentScenario, 
        this.currentEnsemble, 
        this.currentSSTModel
    );
    
    if (!densityData || densityData.length === 0) {
        console.warn('No density data available, falling back to computed heatmap aborted: DEPRECATED');
        return;
    }
    
    console.log(`Creating heatmap with ${densityData.length} cells`);
    
    const activeCells = densityData.filter(cell => cell.count > 0);
    console.log(`Active cells (count > 0): ${activeCells.length}`);
    
    const maxCount = Math.max(...densityData.map(d => d.count));
    console.log(`Max density count: ${maxCount}`);
    
    const levels = [0, 1, 2, 5, 10, 20, 40, 80, 120, 160];
    
    const colors = [
        'rgba(255, 255, 255, 0)',     // 0 - transparent
        'rgba(255, 255, 220, 0.6)',   // 1 - very light yellow
        'rgba(255, 255, 178, 0.7)',   // 2 - light yellow
        'rgba(255, 237, 160, 0.75)',  // 5 - yellow
        'rgba(255, 200, 100, 0.8)',   // 10 - orange-yellow
        'rgba(255, 150, 50, 0.85)',   // 20 - orange
        'rgba(255, 100, 0, 0.9)',     // 40 - dark orange
        'rgba(255, 50, 0, 0.95)',     // 80 - red-orange
        'rgba(200, 0, 0, 0.95)',      // 120 - red
        'rgba(139, 0, 0, 1)'          // 160+ - dark red
    ];
    
    const getColor = (count) => {
        for (let i = levels.length - 1; i >= 0; i--) {
            if (count >= levels[i]) {
                return colors[i];
            }
        }
        return colors[0];
    };
    
    const rectangles = [];
    
    activeCells.forEach(cell => {
        const bounds = [
            [cell.lat_south, cell.lon_west],
            [cell.lat_north, cell.lon_east]
        ];
        
        const rect = L.rectangle(bounds, {
            fillColor: getColor(cell.count),
            fillOpacity: 0.7,
            weight: 0.3,
            color: 'rgba(50, 50, 50, 0.2)',
            interactive: true
        });
        
        rect.bindPopup(`
            <strong>TC Track Density</strong><br>
            <hr style="margin: 5px 0;">
            <b>Center:</b> ${cell.lat_center.toFixed(1)}°, ${cell.lon_center.toFixed(1)}°<br>
            <b>Track Points:</b> ${cell.count}<br>
            <b>Cell Bounds:</b><br>
            &nbsp;&nbsp;Lat: ${cell.lat_south.toFixed(1)}° to ${cell.lat_north.toFixed(1)}°<br>
            &nbsp;&nbsp;Lon: ${cell.lon_west.toFixed(1)}° to ${cell.lon_east.toFixed(1)}°<br>
            <b>Scenario:</b> ${this.currentScenario === 'current' ? 'Historical' : '+' + this.currentScenario.toUpperCase()}<br>
            <b>Ensemble:</b> ${this.currentEnsemble}${this.currentSSTModel ? ' (' + this.currentSSTModel + ')' : ''}
        `);
        
        rect.on('mouseover', function(e) {
            this.setStyle({
                weight: 1,
                color: 'rgba(0, 0, 0, 0.5)'
            });
        });
        
        rect.on('mouseout', function(e) {
            this.setStyle({
                weight: 0.3,
                color: 'rgba(50, 50, 50, 0.2)'
            });
        });
        
        rectangles.push(rect);
    });
    
    console.log(`Created ${rectangles.length} rectangle overlays`);
    if (reqId !== this.heatmapRequestId || !this.showHeatmap) return;
    this.layers.heatmap = L.featureGroup(rectangles);
    this.layers.heatmap.addTo(this.map);
    if (reqId !== this.heatmapRequestId || !this.showHeatmap) return;
    this.heatmapConfig = {
        data: densityData,
        activeCells: activeCells.length,
        maxCount: maxCount,
        levels: levels,
        colors: colors,
        scenario: this.currentScenario,
        ensemble: this.currentEnsemble,
        sstModel: this.currentSSTModel
    };
    
    this.updateHeatmapLegend(levels, colors);
    
    const comparisonPanel = document.getElementById('scenario-comparison');
    if (comparisonPanel) {
        comparisonPanel.classList.add('active');
        const metrics = this.calculateDensityMetrics(densityData);
        this.updateDensityComparisonPanel(metrics);
    }
    
    console.log(`Heatmap created successfully:
        - Scenario: ${this.currentScenario}
        - Ensemble: ${this.currentEnsemble}
        - SST Model: ${this.currentSSTModel || 'N/A'}
        - Active cells: ${activeCells.length}
        - Max density: ${maxCount}
    `);
}

clearHeatmapLayer() {
    if (this.layers.heatmap) {
        this.map.removeLayer(this.layers.heatmap);
        this.layers.heatmap = null;
    }
    this.heatmapConfig = null;
    const mapEl = document.getElementById('map');
    mapEl && mapEl.classList.remove('heatmap-active');
    const heatLegend = document.getElementById('heatmap-legend');
    const densLegend = document.getElementById('density-legend');
    if (heatLegend) heatLegend.style.display = 'none';
    if (densLegend) densLegend.style.display = 'none';
}

calculateDensityMetrics(densityData) {
    const nonZeroCells = densityData.filter(d => d.count > 0);
    const totalCount = densityData.reduce((sum, d) => sum + d.count, 0);
    const maxCount = Math.max(...densityData.map(d => d.count), 0);
    
    const severeCells = nonZeroCells.filter(d => d.count >= 80).length;
    const highCells = nonZeroCells.filter(d => d.count >= 40 && d.count < 80).length;
    const moderateCells = nonZeroCells.filter(d => d.count >= 10 && d.count < 40).length;
    const lowCells = nonZeroCells.filter(d => d.count >= 1 && d.count < 10).length;
    
    return {
        totalCells: nonZeroCells.length,
        totalTrackPoints: totalCount,
        maxDensity: maxCount,
        avgDensity: nonZeroCells.length > 0 ? (totalCount / nonZeroCells.length).toFixed(1) : 0,
        severeCells: severeCells,
        highCells: highCells,
        moderateCells: moderateCells,
        lowCells: lowCells
    };
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
        this.clearHeatmapLayer();
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
    
updateHeatmapLegend(levels, colors) {
    let heatmapLegend = document.getElementById('heatmap-legend');
    if (!heatmapLegend) {
        heatmapLegend = document.createElement('div');
        heatmapLegend.id = 'heatmap-legend';
        heatmapLegend.className = 'legend-box';
        document.getElementById('legend').appendChild(heatmapLegend);
    }
    
    const scenarioInfo = {
        'current': 'Historical (1951-2011)',
        '2k': '+2K Warming (2031-2090)',
        '4k': '+4K Warming (2051-2110)'
    };
    
    let legendHTML = `
        <h4>TC Track Density</h4>
        <p style="font-size: 12px; margin: 5px 0;">${scenarioInfo[this.currentScenario]}</p>
        <div class="density-legend-items">
    `;
    
    // Create legend items
    const levelRanges = [
        { min: 160, max: null, label: '160+' },
        { min: 120, max: 159, label: '120-159' },
        { min: 80, max: 119, label: '80-119' },
        { min: 40, max: 79, label: '40-79' },
        { min: 20, max: 39, label: '20-39' },
        { min: 10, max: 19, label: '10-19' },
        { min: 5, max: 9, label: '5-9' },
        { min: 2, max: 4, label: '2-4' },
        { min: 1, max: 1, label: '1' }
    ];
    
    levelRanges.forEach((range, i) => {
        const colorIndex = levels.length - 1 - i;
        legendHTML += `
            <div class="legend-item" style="margin: 2px 0;">
                <span class="legend-color" style="background: ${colors[colorIndex]}; width: 30px; height: 12px; display: inline-block; border: 1px solid #666;"></span>
                <span style="font-size: 11px; margin-left: 6px;">${range.label}</span>
            </div>
        `;
    });
    
    legendHTML += `
        </div>
        <p style="font-size: 10px; margin-top: 8px; font-style: italic; color: #666;">
            Track points per 2°×3° grid cell<br>
            Data: d4PDF (pre-computed)
        </p>
    `;
    
    heatmapLegend.innerHTML = legendHTML;
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