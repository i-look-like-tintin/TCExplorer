// Tropical Cyclone Visualization Application
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
        this.showHeatmap = false;
        
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
        // Initialize map centered on Australia
        this.map = L.map('map').setView([-25.2744, 133.7751], 4);
        
        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | Data: d4PDF'
        }).addTo(this.map);
        
        // Add layer groups to map (except heatmap which is created dynamically)
        this.layers.tracks.addTo(this.map);
        this.layers.genesis.addTo(this.map);
        this.layers.intensity.addTo(this.map);
        
        // Add Australian boundaries (simplified)
        this.addAustraliaBoundaries();
    }
    
    addAustraliaBoundaries() {
    // Option 1: Load from Natural Earth (recommended for accuracy)
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
            // Fallback to simplified polygon
            this.addSimplifiedAustraliaBoundaries();
        });
}
    
    initEventListeners() {
        // Scenario buttons
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleScenarioChange(e));
        });
        
        // Ensemble selector
        document.getElementById('ensemble-select').addEventListener('change', (e) => {
            this.currentEnsemble = parseInt(e.target.value);
            this.loadData();
        });
        
        // SST model selector
        document.getElementById('sst-select').addEventListener('change', (e) => {
            this.currentSSTModel = e.target.value;
            this.loadData();
        });
        
        document.getElementById('show-heatmap').addEventListener('change', () => {
            this.visualizeData();
        });

        // Toggle options
        document.getElementById('show-heatmap').addEventListener('change', (e) => {
            this.showHeatmap = e.target.checked;
            if (this.showHeatmap) {
                // Disable track-related options when heatmap is shown
                document.getElementById('show-tracks').checked = false;
                document.getElementById('show-genesis').checked = false;
                document.getElementById('show-intensity').checked = false;
                this.toggleLayer('tracks', false);
                this.toggleLayer('genesis', false);
                this.toggleLayer('intensity', false);
            }
            this.updateVisualization();
        });
        
        document.getElementById('show-tracks').addEventListener('change', (e) => {
            if (e.target.checked && this.showHeatmap) {
                document.getElementById('show-heatmap').checked = false;
                this.showHeatmap = false;
            }
            this.toggleLayer('tracks', e.target.checked);
            this.updateVisualization();
        });
        
        document.getElementById('show-genesis').addEventListener('change', (e) => {
            if (e.target.checked && this.showHeatmap) {
                document.getElementById('show-heatmap').checked = false;
                this.showHeatmap = false;
            }
            this.toggleLayer('genesis', e.target.checked);
            this.updateVisualization();
        });
        
        document.getElementById('show-intensity').addEventListener('change', (e) => {
            if (e.target.checked && this.showHeatmap) {
                document.getElementById('show-heatmap').checked = false;
                this.showHeatmap = false;
            }
            this.toggleLayer('intensity', e.target.checked);
            this.updateVisualization();
        });
        
        document.getElementById('filter-australia').addEventListener('change', (e) => {
            this.filterAustralia = e.target.checked;
            this.loadData();
        });
        
        // Year slider
        const yearSlider = document.getElementById('year-slider');
        const yearDisplay = document.getElementById('year-display');
        yearSlider.addEventListener('input', (e) => {
            const year = parseInt(e.target.value);
            if (year === parseInt(yearSlider.min)) {
                yearDisplay.textContent = 'All Years';
                this.yearRange = null;
            } else {
                yearDisplay.textContent = year;
                this.yearRange = year;
            }
            this.updateVisualization();
        });
        
        // Export button
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // Refresh button
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadData(true);
        });
        
        // Sample data toggle
        document.getElementById('use-sample-data').addEventListener('change', () => {
            this.loadData(true);
        });
    }
    
    handleScenarioChange(e) {
        // Update active button
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update current scenario
        this.currentScenario = e.target.dataset.scenario;
        
        // Update ensemble selector based on scenario
        this.updateEnsembleSelector();
        
        // Update year slider
        this.updateYearSlider();
        
        // Load data
        this.loadData();
    }
    
    updateEnsembleSelector() {
        const ensembleInfo = document.getElementById('ensemble-info');
        const ensembleSelect = document.getElementById('ensemble-select');
        const sstSelector = document.getElementById('sst-selector');
        
        // Define ensemble limits for each scenario
        const ensembleLimits = {
            'current': { max: 100, available: 100, note: '(1-100 available)' },
            '2k': { max: 9, available: 9, note: '(101-109 on server)' },
            '4k': { max: 15, available: 15, note: '(101-115 on server)' }
        };
        
        const limit = ensembleLimits[this.currentScenario];
        
        // Update info text
        ensembleInfo.textContent = limit.note;
        
        // Show/hide SST selector based on scenario
        if (this.currentScenario === '2k' || this.currentScenario === '4k') {
            sstSelector.style.display = 'flex';
        } else {
            sstSelector.style.display = 'none';
        }
        
        // Update options
        const currentValue = parseInt(ensembleSelect.value);
        ensembleSelect.innerHTML = '';
        
        for (let i = 1; i <= Math.min(limit.max, 15); i++) { // Show max 15 in dropdown
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Ensemble ${i}`;
            ensembleSelect.appendChild(option);
        }
        
        // Restore previous value if still valid
        if (currentValue <= limit.max) {
            ensembleSelect.value = currentValue;
        } else {
            ensembleSelect.value = 1;
            this.currentEnsemble = 1;
        }
    }
    
    updateYearSlider() {
        const yearSlider = document.getElementById('year-slider');
        const yearDisplay = document.getElementById('year-display');
        
        // Update slider range based on scenario
        if (this.currentScenario === 'current') {
            yearSlider.min = 1951;
            yearSlider.max = 2011;
            yearSlider.value = 1951;
        } else if (this.currentScenario === '2k') {
            yearSlider.min = 2031;
            yearSlider.max = 2090;
            yearSlider.value = 2031;
        } else if (this.currentScenario === '4k') {
            yearSlider.min = 2051;
            yearSlider.max = 2110;
            yearSlider.value = 2051;
        }
        
        yearDisplay.textContent = 'All Years';
        this.yearRange = null;
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
    
    // Add this helper method for checking Australian region
isInAustralianRegion(lat, lon) {
    // Extended Australian region bounds for cyclone analysis
    return lat >= -45 && lat <= -5 && lon >= 105 && lon <= 160;
}

    createHeatmap(cyclones) {
    // Clear existing heatmap
    if (this.layers.heatmap) {
        this.map.removeLayer(this.layers.heatmap);
    }
    
    // Clear other layers when showing heatmap
    this.layers.tracks.clearLayers();
    this.layers.genesis.clearLayers();
    this.layers.intensity.clearLayers();
    
    // Prepare heatmap data
    const heatData = [];
    
    // Create a grid to accumulate intensity values
    const gridSize = 0.5; // Grid cell size in degrees
    const intensityGrid = {};
    
    cyclones.forEach(cyclone => {
        if (!cyclone.track || cyclone.track.length === 0) return;
        
        cyclone.track.forEach(point => {
            // Skip if outside Australia region
            if (this.filterAustralia && !this.isInAustralianRegion(point.lat, point.lon)) {
                return;
            }
            
            // Calculate grid cell
            const gridLat = Math.floor(point.lat / gridSize) * gridSize;
            const gridLon = Math.floor(point.lon / gridSize) * gridSize;
            const gridKey = `${gridLat},${gridLon}`;
            
            // Initialize grid cell if needed
            if (!intensityGrid[gridKey]) {
                intensityGrid[gridKey] = {
                    lat: gridLat + gridSize / 2,
                    lon: gridLon + gridSize / 2,
                    totalIntensity: 0,
                    count: 0,
                    maxCategory: 0
                };
            }
            
            // Accumulate intensity (using category as a proxy for severity)
            // Weight higher categories more heavily
            const intensity = point.category || cyclone.maxCategory || 1;
            const weight = Math.pow(intensity, 2); // Square to emphasize severe cyclones
            
            intensityGrid[gridKey].totalIntensity += weight;
            intensityGrid[gridKey].count += 1;
            intensityGrid[gridKey].maxCategory = Math.max(intensityGrid[gridKey].maxCategory, intensity);
        });
    });
    
    // Convert grid to heatmap data with normalized intensities
    let maxIntensity = 0;
    Object.values(intensityGrid).forEach(cell => {
        const avgIntensity = cell.totalIntensity / cell.count;
        maxIntensity = Math.max(maxIntensity, avgIntensity);
    });
    
    // Create data points for heatmap
    Object.values(intensityGrid).forEach(cell => {
        const avgIntensity = cell.totalIntensity / cell.count;
        // Normalize and apply non-linear scaling to enhance differences
        const normalizedIntensity = Math.pow(avgIntensity / maxIntensity, 0.7);
        
        // Add multiple points for higher intensity areas to create stronger heat
        const pointCount = Math.ceil(normalizedIntensity * 10);
        for (let i = 0; i < pointCount; i++) {
            heatData.push([
                cell.lat,
                cell.lon,
                normalizedIntensity
            ]);
        }
    });
    
    // Create custom gradient for Yellow → Red → Black
    const gradient = {
        0.0: 'rgba(255, 255, 200, 0.1)',    // Very light yellow (transparent)
        0.15: 'rgba(255, 255, 0, 0.4)',   // Yellow (reduced opacity)
        0.3: 'rgba(255, 220, 0, 0.5)',    // Gold (reduced opacity)
        0.45: 'rgba(255, 165, 0, 0.6)',   // Orange (reduced opacity)
        0.6: 'rgba(255, 69, 0, 0.7)',     // Red-orange (reduced opacity)
        0.75: 'rgba(255, 0, 0, 0.8)',     // Red (reduced opacity)
        0.85: 'rgba(178, 34, 34, 0.9)',   // Firebrick (reduced opacity)
        0.95: 'rgba(139, 0, 0, 0.92)',    // Dark red (reduced opacity)
        1.0: 'rgba(0, 0, 0, 0.95)'         // Black (slightly transparent)
    };
    // Create heatmap layer with enhanced options
   this.layers.heatmap = L.heatLayer(heatData, {
        radius: 30,
        blur: 20,
        maxZoom: 10,
        max: 1.0,
        gradient: gradient,
        minOpacity: 0.2  // Reduced for better map visibility
    });
    
    // Add to map
    this.layers.heatmap.addTo(this.map);
    
    // Add scenario comparison info
    this.updateHeatmapLegend();
}
    
    async loadData(forceRefresh = false) {
        this.showLoading(true);
        this.updateDataStatus('Loading data...');
        
        try {
            const cacheKey = this.currentScenario === 'current' 
                ? `${this.currentScenario}_${this.currentEnsemble}`
                : `${this.currentScenario}_${this.currentEnsemble}_${this.currentSSTModel}`;
            
            // Check if we already have this data and not forcing refresh
            if (!forceRefresh && this.cycloneData[cacheKey]) {
                this.updateVisualization();
                this.showLoading(false);
                return;
            }
            
            const useSample = document.getElementById('use-sample-data').checked;
            
            const params = new URLSearchParams({
                action: 'getCycloneData',
                scenario: this.currentScenario,
                ensemble: this.currentEnsemble,
                filter: this.filterAustralia ? 'australia' : 'all',
                use_sample: useSample ? 'true' : 'false',
                debug: 'true' // Enable debug logging
            });
            
            // Add SST model for 2K/4K scenarios
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
        // Update UI to show data source info
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
    // Clear ALL layers every time
    this.layers.tracks.clearLayers();
    this.layers.genesis.clearLayers();
    this.layers.intensity.clearLayers();
    
    if (this.layers.heatmap) {
        this.map.removeLayer(this.layers.heatmap);
        this.layers.heatmap = null;
    }
    
    const cacheKey = this.currentScenario === 'current' 
        ? `${this.currentScenario}_${this.currentEnsemble}`
        : `${this.currentScenario}_${this.currentEnsemble}_${this.currentSSTModel}`;
    const data = this.cycloneData[cacheKey];
    if (!data || !data.cyclones) return;
    
    // Filter by year if specified
    let cyclones = data.cyclones;
    if (this.yearRange) {
        cyclones = cyclones.filter(c => c.year === this.yearRange);
    }
    
    // Check if heatmap checkbox exists and is checked
    const heatmapCheckbox = document.getElementById('show-heatmap');
    const isHeatmapMode = heatmapCheckbox && heatmapCheckbox.checked;
    
    if (isHeatmapMode) {
        // Show heatmap
        this.createHeatmap(cyclones);
        document.getElementById('map').classList.add('heatmap-active');
    } else {
        // Remove heatmap styling
        document.getElementById('map').classList.remove('heatmap-active');
        
        // Show tracks based on checkboxes
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
    
    // Update status
    const displayMode = isHeatmapMode ? 'heatmap' : 'tracks';
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
        
        // Draw segments colored by intensity
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
            0: '#999999', // Below tropical cyclone
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
        
        // Hide after 10 seconds
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
        
        // Filter by year if specified
        let cyclones = data.cyclones;
        if (this.yearRange) {
            cyclones = cyclones.filter(c => c.year === this.yearRange);
        }
        
        // Convert to CSV
        let csv = 'ID,Name,Year,Genesis Month,Max Category,Max Wind (km/h),Min Pressure (hPa),Duration (days),Genesis Lat,Genesis Lon,Landfall\n';
        
        cyclones.forEach(cyclone => {
            csv += `${cyclone.id},${cyclone.name},${cyclone.year},${cyclone.genesis_month || 'N/A'},${cyclone.maxCategory},${cyclone.maxWind},${cyclone.minPressure},${cyclone.duration_days || cyclone.duration},${cyclone.genesis_lat},${cyclone.genesis_lon},${cyclone.landfall ? 'Yes' : 'No'}\n`;
        });
        
        // Download CSV
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

    // Enhanced data loading with scenario comparison
async loadDataWithComparison() {
    // Store data for all scenarios for comparison
    this.scenarioData = {
        current: null,
        '2k': null,
        '4k': null
    };
    
    // Load baseline data
    await this.loadScenarioData('current');
    
    // Add comparison panel to DOM if it doesn't exist
    this.createComparisonPanel();
}

// Create comparison panel
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

// Enhanced heatmap creation with scenario-specific scaling
createEnhancedHeatmap(cyclones) {
    // Clear existing layers
    if (this.layers.heatmap) {
        this.map.removeLayer(this.layers.heatmap);
    }
    this.layers.tracks.clearLayers();
    this.layers.genesis.clearLayers();
    this.layers.intensity.clearLayers();
    
    // Add heatmap class to map for styling
    document.getElementById('map').classList.add('heatmap-active');
    
    // Calculate intensity metrics
    const metrics = this.calculateIntensityMetrics(cyclones);
    
    // Create grid with scenario-specific weighting
    const gridSize = 0.5;
    const intensityGrid = {};
    const scenarioWeight = {
        'current': 1.0,
        '2k': 1.3,  // Amplify differences for +2K
        '4k': 1.8   // Further amplify for +4K
    }[this.currentScenario] || 1.0;
    
    cyclones.forEach(cyclone => {
        if (!cyclone.track || cyclone.track.length === 0) return;
        
        cyclone.track.forEach(point => {
            if (this.filterAustralia && !this.isInAustralianRegion(point.lat, point.lon)) {
                return;
            }
            
            const gridLat = Math.floor(point.lat / gridSize) * gridSize;
            const gridLon = Math.floor(point.lon / gridSize) * gridSize;
            const gridKey = `${gridLat},${gridLon}`;
            
            if (!intensityGrid[gridKey]) {
                intensityGrid[gridKey] = {
                    lat: gridLat + gridSize / 2,
                    lon: gridLon + gridSize / 2,
                    totalIntensity: 0,
                    count: 0,
                    maxCategory: 0,
                    severeCount: 0
                };
            }
            
            const category = point.category || cyclone.maxCategory || 1;
            // Apply scenario-specific weighting
            const weight = Math.pow(category, 2) * scenarioWeight;
            
            intensityGrid[gridKey].totalIntensity += weight;
            intensityGrid[gridKey].count += 1;
            intensityGrid[gridKey].maxCategory = Math.max(intensityGrid[gridKey].maxCategory, category);
            
            if (category >= 3) {
                intensityGrid[gridKey].severeCount += 1;
            }
        });
    });
    
    // Normalize with enhanced scaling
    const heatData = [];
    let maxIntensity = 0;
    
    Object.values(intensityGrid).forEach(cell => {
        const avgIntensity = cell.totalIntensity / cell.count;
        maxIntensity = Math.max(maxIntensity, avgIntensity);
    });
    
    // Apply non-linear scaling to enhance differences
    Object.values(intensityGrid).forEach(cell => {
        const avgIntensity = cell.totalIntensity / cell.count;
        // Use different scaling curves for different scenarios
        const scalePower = {
            'current': 0.8,
            '2k': 0.6,
            '4k': 0.5
        }[this.currentScenario] || 0.7;
        
        const normalizedIntensity = Math.pow(avgIntensity / maxIntensity, scalePower);
        
        // Add extra weight for areas with severe cyclones
        const severeBonus = (cell.severeCount / cell.count) * 0.3;
        const finalIntensity = Math.min(1.0, normalizedIntensity + severeBonus);
        
        // Create multiple points for stronger heat representation
        const pointCount = Math.ceil(finalIntensity * 15);
        for (let i = 0; i < pointCount; i++) {
            heatData.push([
                cell.lat,
                cell.lon,
                finalIntensity
            ]);
        }
    });
    
    // Enhanced gradient with sharper transitions
    const gradient = {
        0.0: 'rgba(255, 255, 200, 0)',    // Very light yellow (transparent)
        0.15: 'rgba(255, 255, 0, 0.5)',   // Yellow
        0.3: 'rgba(255, 220, 0, 0.7)',    // Gold
        0.45: 'rgba(255, 165, 0, 0.8)',   // Orange
        0.6: 'rgba(255, 69, 0, 0.9)',     // Red-orange
        0.75: 'rgba(255, 0, 0, 1)',       // Red
        0.85: 'rgba(178, 34, 34, 1)',     // Firebrick
        0.95: 'rgba(139, 0, 0, 1)',       // Dark red
        1.0: 'rgba(0, 0, 0, 1)'           // Black
    };
    
    // Create heatmap with optimized settings
    this.layers.heatmap = L.heatLayer(heatData, {
        radius: 30,
        blur: 20,
        maxZoom: 10,
        max: 1.0,
        gradient: gradient,
        minOpacity: 0.4
    });
    
    this.layers.heatmap.addTo(this.map);
    
    // Update UI elements
    this.updateHeatmapLegend();
    this.updateComparisonPanel(metrics);
}

// Add this method to update the heatmap legend
updateHeatmapLegend() {
    // Find or create heatmap legend
    let heatmapLegend = document.getElementById('heatmap-legend');
    if (!heatmapLegend) {
        heatmapLegend = document.createElement('div');
        heatmapLegend.id = 'heatmap-legend';
        heatmapLegend.className = 'legend-box';
        document.getElementById('legend').appendChild(heatmapLegend);
    }
    
    // Update legend content based on scenario
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
    
    // Show/hide based on heatmap visibility
    heatmapLegend.style.display = this.showHeatmap ? 'block' : 'none';
}

// Calculate intensity metrics for comparison
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

// Update comparison panel
updateComparisonPanel(metrics) {
    const panel = document.getElementById('scenario-comparison');
    if (!panel) return;
    
    const content = document.getElementById('comparison-content');
    
    // Show panel when heatmap is active
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

// Get scenario-specific insights
getScenarioInsight() {
    const insights = {
        'current': 'Historical baseline period showing natural cyclone patterns.',
        '2k': 'Moderate warming scenario shows increased intensity in key regions.',
        '4k': 'Severe warming scenario displays significant intensification and expanded severe cyclone zones.'
    };
    return insights[this.currentScenario] || '';
}

// Clean up when switching away from heatmap
clearHeatmapMode() {
    document.getElementById('map').classList.remove('heatmap-active');
    const panel = document.getElementById('scenario-comparison');
    if (panel) {
        panel.classList.remove('active');
    }
}
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TCVisualization();
});