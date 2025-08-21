/**
 * Visualization Renderer
 * Handles rendering of cyclone tracks, heatmaps, and other visualizations
 */
class VisualizationRenderer {
    constructor(app) {
        this.app = app;
        this.heatmapConfig = null;
        this.gridResolution = 2; // Default grid resolution for density maps
    }
    
    // Clear all visualization layers
    clearAllLayers() {
        this.app.mapManager.clearAllLayers();
        this.clearHeatmapLegends();
        this.hideComparisonPanel();
    }
    
    // Main method to render standard visualization (tracks, genesis, intensity)
    async renderStandardVisualization(cyclones) {
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
        
        console.log(`Rendered ${cyclones.length} cyclones in standard mode`);
    }
    
    // Draw individual cyclone track
    drawCycloneTrack(cyclone) {
        if (!cyclone.track || cyclone.track.length < 2) return;
        
        const latlngs = cyclone.track.map(point => [point.lat, point.lon]);
        
        const polyline = L.polyline(latlngs, {
            color: this.getTrackColor(cyclone.maxCategory),
            weight: 2,
            opacity: 0.7
        });
        
        polyline.on('click', () => this.app.selectCyclone(cyclone));
        
        this.app.mapManager.addToLayer('tracks', polyline);
    }
    
    // Draw genesis point
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
        
        this.app.mapManager.addToLayer('genesis', marker);
    }
    
    // Draw intensity-colored track segments
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
            
            this.app.mapManager.addToLayer('intensity', segment);
        }
    }
    
    // Create density heatmap using computed grid
    async createDensityHeatmap(cyclones) {
        console.log('Creating density heatmap for', cyclones.length, 'cyclones');
        
        this.clearAllLayers();
        
        const gridResolution = this.gridResolution;
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
        
        // Process each cyclone
        cyclones.forEach(cyclone => {
            if (!cyclone.track || cyclone.track.length === 0) return;
            
            const processedCells = new Set();
            
            for (let i = 0; i < cyclone.track.length; i++) {
                const point = cyclone.track[i];
                const pointCell = this.getCellKey(point.lat, point.lon, gridResolution);
                
                if (!processedCells.has(pointCell)) {
                    processedCells.add(pointCell);
                    tcFreq[pointCell] = (tcFreq[pointCell] || 0) + 1;
                }
                
                // Add line segments between points
                if (i < cyclone.track.length - 1) {
                    const nextPoint = cyclone.track[i + 1];
                    const lineCells = this.getLineCells(
                        point.lat, point.lon, 
                        nextPoint.lat, nextPoint.lon, 
                        gridResolution
                    );
                    
                    lineCells.forEach(cellKey => {
                        if (!processedCells.has(cellKey)) {
                            processedCells.add(cellKey);
                            tcFreq[cellKey] = (tcFreq[cellKey] || 0) + 1;
                        }
                    });
                }
            }
        });
        
        // Create visual representation
        const rectangles = this.createDensityRectangles(tcFreq, gridResolution);
        const heatmapLayer = L.featureGroup(rectangles);
        
        this.app.mapManager.setHeatmapLayer(heatmapLayer);
        
        // Update legend and metrics
        const levels = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 75, 100];
        this.updateDensityLegend(levels);
        
        const metrics = this.calculateDensityMetrics(tcFreq);
        this.updateDensityComparisonPanel(metrics);
        
        console.log(`Density heatmap created: ${Object.keys(tcFreq).length} active cells`);
    }
    
    // Create precomputed heatmap
    async createHeatmap(cyclones) {
        const reqId = ++this.app.heatmapRequestId;
        
        this.clearAllLayers();
        
        this.app.showLoading(true, 'Loading pre-computed density heatmap...');
        
        try {
            const densityData = await this.app.dataManager.fetchPrecomputedDensity(
                this.app.currentScenario, 
                this.app.currentEnsemble, 
                this.app.currentSSTModel
            );
            
            if (!densityData || densityData.length === 0) {
                console.warn('No density data available');
                return;
            }
            
            // Check if request is still current
            if (reqId !== this.app.heatmapRequestId || !this.app.showHeatmap) return;
            
            console.log(`Creating heatmap with ${densityData.length} cells`);
            
            const activeCells = densityData.filter(cell => cell.count > 0);
            const rectangles = this.createPrecomputedHeatmapRectangles(activeCells);
            const heatmapLayer = L.featureGroup(rectangles);
            
            this.app.mapManager.setHeatmapLayer(heatmapLayer);
            
            // Update legend and comparison panel
            const levels = [0, 1, 2, 5, 10, 20, 40, 80, 120, 160];
            const colors = this.getHeatmapColors();
            this.updateHeatmapLegend(levels, colors);
            
            const metrics = this.app.dataManager.calculateMetrics(activeCells);
            this.showComparisonPanel(metrics);
            
            console.log(`Precomputed heatmap created: ${activeCells.length} active cells`);
            
        } finally {
            this.app.showLoading(false);
        }
    }
    
    // Helper methods for density calculations
    getCellKey(lat, lon, gridResolution) {
        // Handle longitude wrapping
        while (lon < -180) lon += 360;
        while (lon > 180) lon -= 360;
        
        const lonIdx = Math.floor((lon + 180) / gridResolution);
        const latIdx = Math.floor((lat + 90) / gridResolution);
        return `${latIdx},${lonIdx}`;
    }
    
    getLineCells(lat1, lon1, lat2, lon2, gridResolution) {
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
        
        // Sample points along the line
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const steps = Math.max(Math.ceil(distance * 2), 2);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            const cellX = Math.floor(x);
            const cellY = Math.floor(y);
            
            // Convert back to lat/lon for the cell key
            const cellLat = (cellY * gridResolution) - 90;
            const cellLon = (cellX * gridResolution) - 180;
            
            if (cellLat >= -90 && cellLat < 90 && cellLon >= -180 && cellLon < 180) {
                cells.add(this.getCellKey(cellLat, cellLon, gridResolution));
            }
        }
        
        return cells;
    }
    
    // Create rectangles for density visualization
    createDensityRectangles(tcFreq, gridResolution) {
        const rectangles = [];
        const worldCopies = this.app.mapManager.getVisibleWorldCopies();
        const colors = this.getDensityColors();
        const levels = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 75, 100];
        
        Object.keys(tcFreq).forEach(cellKey => {
            const count = tcFreq[cellKey];
            if (count > 0) {
                const [latIdx, lonIdx] = cellKey.split(',').map(Number);
                
                const lat = (latIdx * gridResolution) - 90;
                const lon = (lonIdx * gridResolution) - 180;
                
                const fillColor = this.getColorForCount(count, levels, colors);
                const rectStyle = {
                    fillColor: fillColor,
                    fillOpacity: 0.8,
                    weight: 0.5,
                    color: 'rgba(100, 100, 100, 0.3)',
                    interactive: true
                };
                
                worldCopies.forEach(offset => {
                    const bounds = [
                        [lat, lon + offset],
                        [lat + gridResolution, lon + gridResolution + offset]
                    ];
                    
                    if (lon + offset > -540 && lon + gridResolution + offset < 540) {
                        const rect = L.rectangle(bounds, rectStyle);
                        rect.bindPopup(`
                            <strong>TC Track Density</strong><br>
                            Cell: ${lat.toFixed(1)}°, ${lon.toFixed(1)}°<br>
                            Track Count: ${count}
                        `);
                        rectangles.push(rect);
                    }
                });
            }
        });
        
        return rectangles;
    }
    
    // Create rectangles for precomputed heatmap
    createPrecomputedHeatmapRectangles(activeCells) {
        const rectangles = [];
        const worldCopies = this.app.mapManager.getVisibleWorldCopies();
        const levels = [0, 1, 2, 5, 10, 20, 40, 80, 120, 160];
        const colors = this.getHeatmapColors();
        
        activeCells.forEach(cell => {
            const fillColor = this.getColorForCount(cell.count, levels, colors);
            const rectStyle = {
                fillColor: fillColor,
                fillOpacity: 0.7,
                weight: 0.3,
                color: 'rgba(50, 50, 50, 0.2)',
                interactive: true
            };
            
            worldCopies.forEach(offset => {
                const bounds = [
                    [cell.lat_south, cell.lon_west + offset],
                    [cell.lat_north, cell.lon_east + offset]
                ];
                
                if (cell.lon_west + offset > -540 && cell.lon_east + offset < 540) {
                    const rect = L.rectangle(bounds, rectStyle);
                    
                    const popupContent = `
                        <strong>TC Track Density</strong><br>
                        <hr style="margin: 5px 0;">
                        <b>Center:</b> ${cell.lat_center.toFixed(1)}°, ${cell.lon_center.toFixed(1)}°<br>
                        <b>Track Points:</b> ${cell.count}<br>
                        <b>Scenario:</b> ${this.app.currentScenario === 'current' ? 'Historical' : '+' + this.app.currentScenario.toUpperCase()}<br>
                        <b>Ensemble:</b> ${this.app.currentEnsemble}${this.app.currentSSTModel ? ' (' + this.app.currentSSTModel + ')' : ''}
                    `;
                    
                    rect.bindPopup(popupContent);
                    
                    // Add hover effects
                    rect.on('mouseover', function(e) {
                        this.setStyle({ weight: 1, color: 'rgba(0, 0, 0, 0.5)' });
                    });
                    
                    rect.on('mouseout', function(e) {
                        this.setStyle({ weight: 0.3, color: 'rgba(50, 50, 50, 0.2)' });
                    });
                    
                    rectangles.push(rect);
                }
            });
        });
        
        return rectangles;
    }
    
    // Color management
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
    
    getDensityColors() {
        return [
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
    }
    
    getHeatmapColors() {
        return [
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
    }
    
    getColorForCount(count, levels, colors) {
        for (let i = levels.length - 1; i >= 0; i--) {
            if (count >= levels[i]) {
                return colors[i];
            }
        }
        return colors[0];
    }
    
    // Legend management
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
        
        const colors = this.getDensityColors();
        const displayLevels = [
            { value: 100, color: colors[13], label: '100+' },
            { value: 75, color: colors[12], label: '75-99' },
            { value: 50, color: colors[11], label: '50-74' },
            { value: 30, color: colors[10], label: '30-49' },
            { value: 20, color: colors[9], label: '20-29' },
            { value: 15, color: colors[8], label: '15-19' },
            { value: 10, color: colors[7], label: '10-14' },
            { value: 7, color: colors[6], label: '7-9' },
            { value: 5, color: colors[5], label: '5-6' },
            { value: 4, color: colors[4], label: '4' },
            { value: 3, color: colors[3], label: '3' },
            { value: 2, color: colors[2], label: '2' },
            { value: 1, color: colors[1], label: '1' }
        ];
        
        let legendHTML = `
            <h4>TC Track Density</h4>
            <p style="font-size: 12px; margin: 5px 0;">${scenarioInfo[this.app.currentScenario]}</p>
            <div class="density-legend-items">
        `;
        
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
                (${this.gridResolution}° × ${this.gridResolution}° resolution)
            </p>
        `;
        
        densityLegend.innerHTML = legendHTML;
        densityLegend.style.display = 'block';
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
        
        let legendHTML = `
            <h4>TC Track Density</h4>
            <p style="font-size: 12px; margin: 5px 0;">${scenarioInfo[this.app.currentScenario]}</p>
            <div class="density-legend-items">
        `;
        
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
        heatmapLegend.style.display = 'block';
    }
    
    clearHeatmapLegends() {
        const heatmapLegend = document.getElementById('heatmap-legend');
        const densityLegend = document.getElementById('density-legend');
        if (heatmapLegend) heatmapLegend.style.display = 'none';
        if (densityLegend) densityLegend.style.display = 'none';
    }
    
    // Comparison panel management
    createComparisonPanel() {
        if (!document.getElementById('scenario-comparison')) {
            const panel = document.createElement('div');
            panel.id = 'scenario-comparison';
            panel.className = 'scenario-comparison';
            panel.innerHTML = `
                <h4>Scenario Comparison</h4>
                <div id="comparison-content">
                    <p style="font-size: 12px; color: #666;">
                        Switch between scenarios to compare TC patterns
                    </p>
                </div>
            `;
            document.getElementById('map').appendChild(panel);
        }
    }
    
    showComparisonPanel(metrics) {
        const panel = document.getElementById('scenario-comparison');
        const content = document.getElementById('comparison-content');
        
        if (panel && content) {
            panel.classList.add('active');
            this.updateComparisonContent(content, metrics);
        }
    }
    
    hideComparisonPanel() {
        const panel = document.getElementById('scenario-comparison');
        if (panel) {
            panel.classList.remove('active');
        }
    }
    
    updateComparisonContent(content, metrics) {
        content.innerHTML = `
            <div class="comparison-item">
                <div class="scenario-label">${this.app.currentScenario === 'current' ? 'Historical' : '+' + this.app.currentScenario.toUpperCase() + ' Warming'}</div>
                <div class="metric">Total Cyclones: ${metrics.totalCyclones}</div>
                <div class="metric">Severe (Cat 3+): ${metrics.severeCyclones}</div>
                <div class="metric">Avg Category: ${metrics.avgMaxCategory}</div>
                <div class="metric">Max Wind: ${metrics.maxWindSpeed} km/h</div>
                <div class="metric">Landfalls: ${metrics.landfallCount}</div>
            </div>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
                ${this.getScenarioInsight()}
            </p>
        `;
    }
    
    updateDensityComparisonPanel(metrics) {
        const content = document.getElementById('comparison-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="comparison-item">
                <div class="scenario-label">${this.app.currentScenario === 'current' ? 'Historical' : '+' + this.app.currentScenario.toUpperCase() + ' Warming'}</div>
                <div class="metric"><b>Active Cells:</b> ${metrics.totalCells}</div>
                <div class="metric"><b>Total Track Points:</b> ${metrics.totalTrackPoints}</div>
                <div class="metric"><b>Max Density:</b> ${metrics.maxCellDensity}</div>
                <div class="metric"><b>Avg Density:</b> ${metrics.avgDensity}</div>
            </div>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
                Density computed from d4PDF track data<br>
                Grid: ${this.gridResolution}° resolution
            </p>
        `;
        
        const panel = document.getElementById('scenario-comparison');
        if (panel) panel.classList.add('active');
    }
    
    calculateDensityMetrics(tcFreq) {
        const totalCells = Object.keys(tcFreq).length;
        const maxDensity = Math.max(...Object.values(tcFreq), 0);
        const totalPoints = Object.values(tcFreq).reduce((a, b) => a + b, 0);
        
        return {
            totalTrackPoints: totalPoints,
            totalCells: totalCells,
            maxCellDensity: maxDensity,
            avgDensity: totalCells > 0 ? (totalPoints / totalCells).toFixed(1) : 0,
            gridResolution: this.gridResolution
        };
    }
    
    getScenarioInsight() {
        const insights = {
            'current': 'Historical baseline period showing natural cyclone patterns.',
            '2k': 'Moderate warming scenario shows increased intensity in key regions.',
            '4k': 'Severe warming scenario displays significant intensification and expanded severe cyclone zones.'
        };
        return insights[this.app.currentScenario] || '';
    }
}