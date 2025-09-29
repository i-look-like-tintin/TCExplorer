class VisualizationRenderer {
    constructor(app) {
        this.app = app;
        this.heatmapConfig = null;
        this.gridResolution = 2;
        this.comparisonColors = {
            A: { 
                track: '#3498db', 
                genesis: '#2980b9',
                name: 'Scenario A'
            },
            B: { 
                track: '#e74c3c', 
                genesis: '#c0392b',
                name: 'Scenario B'
            }
        };
    }
    
    clearAllLayers() {
        this.app.mapManager.clearAllLayers();
        this.clearHeatmapLegends();
        this.hideComparisonPanel();
    }
    
    async renderComparisonVisualization(cyclonesA, cyclonesB, scenarioA, scenarioB) {
        const showTracks = document.getElementById('show-tracks').checked;
        const showGenesis = document.getElementById('show-genesis').checked;
        const showIntensity = document.getElementById('show-intensity').checked;
        
        if (showTracks || showIntensity) {
            cyclonesA.forEach(cyclone => {
                this.drawComparisonTrack(cyclone, 'A', showIntensity);
            });
            
            cyclonesB.forEach(cyclone => {
                this.drawComparisonTrack(cyclone, 'B', showIntensity);
            });
        }
        
        if (showGenesis) {
            cyclonesA.forEach(cyclone => {
                this.drawComparisonGenesisPoint(cyclone, 'A');
            });
            
            cyclonesB.forEach(cyclone => {
                this.drawComparisonGenesisPoint(cyclone, 'B');
            });
        }
        
        this.updateComparisonLegend(scenarioA, scenarioB);
        this.showComparisonMetrics(cyclonesA, cyclonesB, scenarioA, scenarioB);
        
    }
    
    drawComparisonTrack(cyclone, scenarioType, useIntensity = false) {
        if (!cyclone.track || cyclone.track.length < 2) return;
        
        if (useIntensity) {
            this.drawComparisonIntensityTrack(cyclone, scenarioType);
        } else {
            const latlngs = cyclone.track.map(point => [point.lat, point.lon]);
            const color = this.comparisonColors[scenarioType].track;
            
            const polyline = L.polyline(latlngs, {
                color: color,
                weight: 2,
                opacity: 0.7
            });
            
            polyline.on('click', () => this.app.selectCyclone(cyclone));
            
            this.app.mapManager.addToLayer('tracks', polyline);
        }
    }
    
    drawComparisonIntensityTrack(cyclone, scenarioType) {
        if (!cyclone.track || cyclone.track.length < 2) return;

        const baseColor = this.comparisonColors[scenarioType].track;

        // Group consecutive segments by category to reduce polyline objects
        const segmentGroups = [];
        let currentGroup = {
            category: cyclone.track[0].category,
            points: [[cyclone.track[0].lat, cyclone.track[0].lon]]
        };

        for (let i = 1; i < cyclone.track.length; i++) {
            const point = cyclone.track[i];
            if (point.category === currentGroup.category) {
                // Same category, add to current group
                currentGroup.points.push([point.lat, point.lon]);
            } else {
                // Different category, start new group
                // Add last point of current group to maintain continuity
                currentGroup.points.push([point.lat, point.lon]);
                segmentGroups.push(currentGroup);
                currentGroup = {
                    category: point.category,
                    points: [[point.lat, point.lon]]
                };
            }
        }
        // Don't forget the last group
        if (currentGroup.points.length > 0) {
            segmentGroups.push(currentGroup);
        }

        // Draw each group as a single polyline with blended color
        segmentGroups.forEach(group => {
            if (group.points.length >= 2) {
                const intensityColor = this.blendColors(
                    baseColor,
                    this.getIntensityColor(group.category),
                    0.6
                );

                const polyline = L.polyline(group.points, {
                    color: intensityColor,
                    weight: 4,
                    opacity: 0.8
                });
                this.app.mapManager.addToLayer('intensity', polyline);
            }
        });
    }
    
    drawComparisonGenesisPoint(cyclone, scenarioType) {
        if (!cyclone.track || cyclone.track.length === 0) return;
        
        const genesis = cyclone.track[0];
        const color = this.comparisonColors[scenarioType].genesis;
        const scenarioName = this.getScenarioDisplayName(
            scenarioType === 'A' ? this.app.comparisonScenarioA : this.app.comparisonScenarioB
        );
        
        const marker = L.circleMarker([genesis.lat, genesis.lon], {
            radius: 6,
            fillColor: color,
            color: 'white',
            weight: 2,
            fillOpacity: 0.8
        });
        
        marker.bindPopup(`
            <strong>${cyclone.name}</strong><br>
            Scenario: ${scenarioName}<br>
            Genesis: ${genesis.date}<br>
            Year: ${cyclone.year}
        `);
        
        this.app.mapManager.addToLayer('genesis', marker);
    }
    
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
        
    }
    
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

    drawIntensityTrack(cyclone) {
        if (!cyclone.track || cyclone.track.length < 2) return;

        // Group consecutive segments by category to reduce polyline objects
        const segmentGroups = [];
        let currentGroup = {
            category: cyclone.track[0].category,
            points: [[cyclone.track[0].lat, cyclone.track[0].lon]]
        };

        for (let i = 1; i < cyclone.track.length; i++) {
            const point = cyclone.track[i];
            if (point.category === currentGroup.category) {
                // Same category, add to current group
                currentGroup.points.push([point.lat, point.lon]);
            } else {
                // Different category, start new group
                // Add last point of current group to maintain continuity
                currentGroup.points.push([point.lat, point.lon]);
                segmentGroups.push(currentGroup);
                currentGroup = {
                    category: point.category,
                    points: [[point.lat, point.lon]]
                };
            }
        }
        // Don't forget the last group
        if (currentGroup.points.length > 0) {
            segmentGroups.push(currentGroup);
        }

        // Draw each group as a single polyline
        segmentGroups.forEach(group => {
            if (group.points.length >= 2) {
                const polyline = L.polyline(group.points, {
                    color: this.getIntensityColor(group.category),
                    weight: 4,
                    opacity: 0.8
                });
                this.app.mapManager.addToLayer('intensity', polyline);
            }
        });
    }
    
    updateComparisonLegend(scenarioA, scenarioB) {
        const legend = document.getElementById('legend');
        const scenarioAName = this.getScenarioDisplayName(scenarioA);
        const scenarioBName = this.getScenarioDisplayName(scenarioB);
        
        legend.innerHTML = `
            <h4>Scenario Comparison</h4>
            <div class="legend-item" style="margin-bottom: 0.8rem;">
                <span class="legend-color" style="background: ${this.comparisonColors.A.track}; border: 1px solid #fff;"></span>
                <span><strong>${scenarioAName}</strong></span>
            </div>
            <div class="legend-item" style="margin-bottom: 0.8rem;">
                <span class="legend-color" style="background: ${this.comparisonColors.B.track}; border: 1px solid #fff;"></span>
                <span><strong>${scenarioBName}</strong></span>
            </div>
            
            <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid #ddd;">
                <h4>Intensity Categories</h4>
                <div class="legend-item">
                    <span class="legend-color" style="background: #1f78b4;"></span>
                    <span>Category 1</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #33a02c;"></span>
                    <span>Category 2</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #ff7f00;"></span>
                    <span>Category 3</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #e31a1c;"></span>
                    <span>Category 4</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #6a3d9a;"></span>
                    <span>Category 5</span>
                </div>
            </div>
            
            <p style="font-size: 11px; margin-top: 10px; color: #666; font-style: italic;">
                ${this.getShowIntensityNotice()}
            </p>
        `;
    }
    
    getShowIntensityNotice() {
        const showIntensity = document.getElementById('show-intensity').checked;
        if (showIntensity) {
            return 'Intensity colors blend with scenario colors when both are enabled.';
        }
        return 'Enable "Show Intensity Colors" to see category-based coloring.';
    }
    
    showComparisonMetrics(cyclonesA, cyclonesB, scenarioA, scenarioB) {
        const metricsA = this.app.dataManager.calculateMetrics(cyclonesA);
        const metricsB = this.app.dataManager.calculateMetrics(cyclonesB);
        
        const scenarioAName = this.getScenarioDisplayName(scenarioA);
        const scenarioBName = this.getScenarioDisplayName(scenarioB);
        
        const content = document.getElementById('comparison-content');
        if (content) {
            content.innerHTML = `
                <div class="comparison-item" style="background: rgba(52, 152, 219, 0.1);">
                    <div class="scenario-label" style="color: ${this.comparisonColors.A.track};">
                        <strong>${scenarioAName}</strong>
                    </div>
                    <div class="metric">Total: ${metricsA.totalCyclones}</div>
                    <div class="metric">Severe (Cat 3+): ${metricsA.severeCyclones}</div>
                    <div class="metric">Avg Category: ${metricsA.avgMaxCategory}</div>
                    <div class="metric">Landfalls: ${metricsA.landfallCount}</div>
                </div>
                
                <div class="comparison-item" style="background: rgba(231, 76, 60, 0.1); margin-top: 8px;">
                    <div class="scenario-label" style="color: ${this.comparisonColors.B.track};">
                        <strong>${scenarioBName}</strong>
                    </div>
                    <div class="metric">Total: ${metricsB.totalCyclones}</div>
                    <div class="metric">Severe (Cat 3+): ${metricsB.severeCyclones}</div>
                    <div class="metric">Avg Category: ${metricsB.avgMaxCategory}</div>
                    <div class="metric">Landfalls: ${metricsB.landfallCount}</div>
                </div>
                
                ${this.getComparisonInsights(metricsA, metricsB, scenarioA, scenarioB)}
            `;
        }
        
        this.showComparisonPanel();
    }
    
    getComparisonInsights(metricsA, metricsB, scenarioA, scenarioB) {
        const totalDiff = metricsB.totalCyclones - metricsA.totalCyclones;
        const severeDiff = metricsB.severeCyclones - metricsA.severeCyclones;
        const landfallDiff = metricsB.landfallCount - metricsA.landfallCount;
        
        let insights = '<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd;">';
        
        if (totalDiff !== 0) {
            const change = totalDiff > 0 ? 'increase' : 'decrease';
            const color = totalDiff > 0 ? '#e67e22' : '#27ae60';
            insights += `<p style="font-size: 11px; color: ${color}; margin: 2px 0;">
                <strong>${Math.abs(totalDiff)} cyclone ${change}</strong> between scenarios
            </p>`;
        }
        
        if (severeDiff !== 0) {
            const change = severeDiff > 0 ? 'increase' : 'decrease';
            const color = severeDiff > 0 ? '#e74c3c' : '#27ae60';
            insights += `<p style="font-size: 11px; color: ${color}; margin: 2px 0;">
                <strong>${Math.abs(severeDiff)} severe cyclone ${change}</strong>
            </p>`;
        }
        
        insights += '</div>';
        return insights;
    }
    
    getScenarioDisplayName(scenario) {
        const names = {
            'current': 'Historical',
            'nat': 'Natural',
            '2k': '+2K Warming',
            '4k': '+4K Warming'
        };
        return names[scenario] || scenario;
    }
    
    blendColors(color1, color2, ratio) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
        
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

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
            
            if (reqId !== this.app.heatmapRequestId || !this.app.showHeatmap) return;
            
            
            const activeCells = densityData.filter(cell => cell.count > 0);
            const rectangles = this.createPrecomputedHeatmapRectangles(activeCells);
            const heatmapLayer = L.featureGroup(rectangles);
            
            this.app.mapManager.setHeatmapLayer(heatmapLayer);
            
            const levels = [0, 1, 2, 5, 10, 20, 40, 80, 120, 160];
            const colors = this.getHeatmapColors();
            this.updateHeatmapLegend(levels, colors);
            
            const metrics = this.app.dataManager.calculateMetrics(activeCells);
            this.showComparisonPanel(metrics);
            
            
        } finally {
            this.app.showLoading(false);
        }
    }

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
    
    getHeatmapColors() {
        return [
            'rgba(255, 255, 255, 0)',     
            'rgba(255, 255, 220, 0.6)',   
            'rgba(255, 255, 178, 0.7)',   
            'rgba(255, 237, 160, 0.75)',  
            'rgba(255, 200, 100, 0.8)',   
            'rgba(255, 150, 50, 0.85)',   
            'rgba(255, 100, 0, 0.9)',     
            'rgba(255, 50, 0, 0.95)',     
            'rgba(200, 0, 0, 0.95)',      
            'rgba(139, 0, 0, 1)'          
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
            'nat': 'Natural Climate (1951-2010)',
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
        if (heatmapLegend) heatmapLegend.style.display = 'none';
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
            if (!this.app.comparisonMode) {
                this.updateComparisonContent(content, metrics);
            }
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