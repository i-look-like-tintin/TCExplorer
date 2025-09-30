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
                maxBoundsViscosity: 0,
                // iOS-specific fixes
                tap: true,
                tapTolerance: 15,
                touchZoom: true,
                preferCanvas: true,
                // Force redraw on iOS
                renderer: L.canvas({ padding: 0.5 })
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
            
            // Load regional boundaries for geographic context
            await this.addAustraliaBoundaries();
            
            // Set up map event handlers
            this.setupMapEvents();

            // iOS-specific fixes
            this.applyIOSFixes();

        } catch (error) {
            console.error('Failed to initialize map:', error);
            throw error;
        }
    }

    applyIOSFixes() {
        // Fix for iOS Safari map rendering issues
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        if (isIOS || isSafari) {
            // Force map invalidate after a short delay
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize(true);
                    // Additional redraw
                    this.map.getContainer().style.height = this.map.getContainer().style.height;
                }
            }, 100);

            // Handle orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize(true);
                    }
                }, 500);
            });

            // Handle window resize for iOS Safari
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize(true);
                    }
                }, 100);
            });
        }
    
    setupMapEvents() {
        // Handle zoom events for heatmap optimization
        this.map.on('zoomstart', () => {
            if (this.layers.heatmap) {
                this.map.getContainer().classList.add('zooming');
            }
        });
        
        this.map.on('zoomend', () => {
            this.map.getContainer().classList.remove('zooming');
        });
        
        this.map.on('moveend', () => {
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
                
            } else {
                throw new Error('Australia not found in dataset');
            }
        } catch (error) {
            console.error('Failed to load Australia boundaries:', error);
        }
    }
    
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
    
    // Enhanced querying capabilities for geographic analysis 
    isInAustralianRegion(lat, lon) {
        return lat >= -45 && lat <= -5 && lon >= 105 && lon <= 160;
    }
    
    isOverAustralia(lat, lon) {
        // Simplified bounding box check for landfall detection
        return (lat > -39 && lat < -10 && lon > 113 && lon < 154);
    }
    
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