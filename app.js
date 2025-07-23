// Tropical Cyclone Visualization Application
class TCVisualization {
    constructor() {
        this.map = null;
        this.currentScenario = 'current';
        this.cycloneData = {};
        this.layers = {
            tracks: L.layerGroup(),
            genesis: L.layerGroup(),
            intensity: L.layerGroup()
        };
        this.selectedCyclone = null;
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.initEventListeners();
        this.loadData();
    }
    
    initMap() {
        // Initialize map centered on Australia
        this.map = L.map('map').setView([-25.2744, 133.7751], 4);
        
        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add all layer groups to map
        Object.values(this.layers).forEach(layer => layer.addTo(this.map));
        
        // Add Australian boundaries (simplified)
        this.addAustraliaBoundaries();
    }
    
    addAustraliaBoundaries() {
        // Simplified Australia polygon
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
        // Scenario buttons
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleScenarioChange(e));
        });
        
        // Toggle options
        document.getElementById('show-tracks').addEventListener('change', (e) => {
            this.toggleLayer('tracks', e.target.checked);
        });
        
        document.getElementById('show-genesis').addEventListener('change', (e) => {
            this.toggleLayer('genesis', e.target.checked);
        });
        
        document.getElementById('show-intensity').addEventListener('change', (e) => {
            this.toggleLayer('intensity', e.target.checked);
        });
        
        // Time slider
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');
        timeSlider.addEventListener('input', (e) => {
            timeDisplay.textContent = e.target.value;
            this.filterByTime(e.target.value);
        });
        
        // Export button
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
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
        this.updateVisualization();
    }
    
    toggleLayer(layerName, visible) {
        if (visible) {
            this.layers[layerName].addTo(this.map);
        } else {
            this.map.removeLayer(this.layers[layerName]);
        }
    }
    
    async loadData() {
        this.showLoading(true);
        
        try {
            const response = await fetch(`api.php?action=getCycloneData&scenario=${this.currentScenario}`);
            const data = await response.json();
            
            if (data.success) {
                this.cycloneData[this.currentScenario] = data.data;
                this.updateVisualization();
            } else {
                console.error('Failed to load data:', data.error);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    updateVisualization() {
        // Clear existing layers
        Object.values(this.layers).forEach(layer => layer.clearLayers());
        
        const data = this.cycloneData[this.currentScenario];
        if (!data || !data.cyclones) return;
        
        // Process each cyclone
        data.cyclones.forEach(cyclone => {
            this.drawCycloneTrack(cyclone);
            this.drawGenesisPoint(cyclone);
            if (document.getElementById('show-intensity').checked) {
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
        
        marker.bindPopup(`<strong>${cyclone.name}</strong><br>Genesis: ${genesis.date}`);
        
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
            <p><strong>Name:</strong> ${cyclone.name}</p>
            <p><strong>Year:</strong> ${cyclone.year}</p>
            <p><strong>Max Category:</strong> ${cyclone.maxCategory}</p>
            <p><strong>Max Wind Speed:</strong> ${cyclone.maxWind} km/h</p>
            <p><strong>Min Pressure:</strong> ${cyclone.minPressure} hPa</p>
            <p><strong>Duration:</strong> ${cyclone.duration} days</p>
            <p><strong>Landfall:</strong> ${cyclone.landfall ? 'Yes' : 'No'}</p>
        `;
        
        infoPanel.classList.remove('hidden');
        
        // Hide after 10 seconds
        setTimeout(() => {
            infoPanel.classList.add('hidden');
        }, 10000);
    }
    
    filterByTime(year) {
        const data = this.cycloneData[this.currentScenario];
        if (!data || !data.cyclones) return;
        
        // Clear and redraw with filtered data
        Object.values(this.layers).forEach(layer => layer.clearLayers());
        
        data.cyclones.forEach(cyclone => {
            if (cyclone.year <= parseInt(year)) {
                this.drawCycloneTrack(cyclone);
                this.drawGenesisPoint(cyclone);
                if (document.getElementById('show-intensity').checked) {
                    this.drawIntensityTrack(cyclone);
                }
            }
        });
    }
    
    exportData() {
        const data = this.cycloneData[this.currentScenario];
        if (!data || !data.cyclones) {
            alert('No data to export');
            return;
        }
        
        // Convert to CSV
        let csv = 'Name,Year,Max Category,Max Wind (km/h),Min Pressure (hPa),Duration (days),Landfall\n';
        
        data.cyclones.forEach(cyclone => {
            csv += `${cyclone.name},${cyclone.year},${cyclone.maxCategory},${cyclone.maxWind},${cyclone.minPressure},${cyclone.duration},${cyclone.landfall ? 'Yes' : 'No'}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cyclone_data_${this.currentScenario}_${new Date().toISOString().split('T')[0]}.csv`;
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
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TCVisualization();
});