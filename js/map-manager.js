/**
 * Map Manager
 * Handles map initialization, layer management, and geographical features
 */
class MapManager {
    constructor(app) {
        this.app = app;
        this.map = null;
        this.layers = {
            tracks: L.layerGroup(),
            genesis: L.layerGroup(),
            intensity: L.layerGroup(),
            heatmap: null
        };
        this.previousZoom = null;
        this.previousCenter = null;
    }
    
    async initializeMap() {
        try {
            this.map = L.map('map', {
                worldCopyJump: false,
                maxBoundsViscosity: 0
            }).setView([-25.2744, 133.7751], 4);
            
            // Add base tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'TC Explorer created by Team 7 Sharks',
                noWrap: false
            }).addTo(this.map);
            
            // Add default layers
            this.layers.tracks.addTo(this.map);
            this.layers.genesis.addTo(this.map);
            this.layers.intensity.addTo(this.map);
            
            // Add geographical boundaries
            await this.addAustraliaBoundaries();
            
            // Set up map event handlers
            this.setupMapEvents();
            
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize map:', error);
            throw error;
        }
    }
    
    setupMapEvents() {
        // Handle zoom events for heatmap optimization
        this.map.on('zoomstart', () => {
            if (this.layers.heatmap) {
                this.map.getContainer().classList.add('zooming');
            }
        });
        
        this.map.on('zoomend', () => {
            // Additional zoom handling can be added here if needed
            this.map.getContainer().classList.remove('zooming');
        });
        
        // Handle map bounds for world copy optimization
        this.map.on('moveend', () => {
            // This can be used for dynamic layer optimization
        });
    }
    
    async addAustraliaBoundaries() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson');
            const data = await response.json();
            
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
                
                console.log('Australia boundaries loaded successfully');
            } else {
                throw new Error('Australia not found in dataset');
            }
        } catch (error) {
            console.error('Failed to load Australia boundaries:', error);
            this.addSimplifiedAustraliaBoundaries();
        }
    }
    
    addSimplifiedAustraliaBoundaries() {
        console.log('Using simplified Australia boundaries');
        
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
    
    // Layer management methods
    getLayer(layerName) {
        return this.layers[layerName];
    }
    
    clearLayer(layerName) {
        if (this.layers[layerName]) {
            if (layerName === 'heatmap' && this.layers[layerName]) {
                this.map.removeLayer(this.layers[layerName]);
                this.layers[layerName] = null;
            } else {
                this.layers[layerName].clearLayers();
            }
        }
    }
    
    clearAllLayers() {
        Object.keys(this.layers).forEach(layerName => {
            this.clearLayer(layerName);
        });
        
        // Remove heatmap-specific styling
        const mapEl = document.getElementById('map');
        if (mapEl) {
            mapEl.classList.remove('heatmap-active');
        }
    }
    
    addToLayer(layerName, item) {
        if (this.layers[layerName] && this.layers[layerName].addLayer) {
            this.layers[layerName].addLayer(item);
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
    
    setHeatmapLayer(layer) {
        if (this.layers.heatmap) {
            this.map.removeLayer(this.layers.heatmap);
        }
        this.layers.heatmap = layer;
        if (layer) {
            layer.addTo(this.map);
            document.getElementById('map').classList.add('heatmap-active');
        }
    }
    
    // Utility methods for world wrapping
    getVisibleWorldCopies() {
        const bounds = this.map.getBounds();
        const west = bounds.getWest();
        const east = bounds.getEast();
        
        const copies = [0]; // Always include the primary world
        
        // Add copies as needed based on visible bounds
        if (west < -180) copies.push(-360);
        if (east > 180) copies.push(360);
        if (west < -540) copies.push(-720);
        if (east > 540) copies.push(720);
        
        return copies;
    }
    
    // Geographic utility methods
    isInAustralianRegion(lat, lon) {
        return lat >= -45 && lat <= -5 && lon >= 105 && lon <= 160;
    }
    
    isOverAustralia(lat, lon) {
        // Simplified bounding box check for landfall detection
        return (lat > -39 && lat < -10 && lon > 113 && lon < 154);
    }
    
    // Map state management
    saveMapState() {
        this.previousZoom = this.map.getZoom();
        this.previousCenter = this.map.getCenter();
    }
    
    restoreMapState() {
        if (this.previousZoom && this.previousCenter) {
            this.map.setView(this.previousCenter, this.previousZoom);
        }
    }
    
    // Fit map to data bounds
    fitToBounds(bounds, options = {}) {
        if (bounds && bounds.length > 0) {
            this.map.fitBounds(bounds, {
                padding: [20, 20],
                maxZoom: 8,
                ...options
            });
        }
    }
    
    // Get current map bounds
    getCurrentBounds() {
        return this.map.getBounds();
    }
    
    // Pan to specific location
    panTo(lat, lon, zoom = null) {
        if (zoom) {
            this.map.setView([lat, lon], zoom);
        } else {
            this.map.panTo([lat, lon]);
        }
    }
}