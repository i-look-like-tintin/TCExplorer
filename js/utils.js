class TCUtils {
    constructor() {
        this.notificationId = 0;
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notificationId = `notification-${++this.notificationId}`;
        
        let notification = document.getElementById(notificationId);
        if (!notification) {
            notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = 'tc-notification';
            notification.style.cssText = this.getNotificationStyles(type);
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.opacity = '1';
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        return notificationId;
    }
    
    getNotificationStyles(type) {
        const baseStyles = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
            transition: opacity 0.3s;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const typeColors = {
            'info': '#2196F3',
            'success': '#4CAF50',
            'warning': '#ff9800',
            'error': '#f44336'
        };
        
        return baseStyles + `background: ${typeColors[type] || typeColors.info};`;
    }
    
    exportComparisonToCSV(dataA, dataB, scenarioA, scenarioB, ensembleA, ensembleB, sstModelA, sstModelB, yearRange) {
        if (!dataA?.cyclones || !dataB?.cyclones) {
            this.showNotification('No comparison data to export', 'error');
            return;
        }
        
        let cyclonesA = dataA.cyclones;
        let cyclonesB = dataB.cyclones;
        
        if (yearRange) {
            cyclonesA = cyclonesA.filter(c => 
                c.year >= yearRange.min && c.year <= yearRange.max
            );
            cyclonesB = cyclonesB.filter(c => 
                c.year >= yearRange.min && c.year <= yearRange.max
            );
        }
        
        let csv = 'Scenario,ID,Name,Year,Genesis Month,Max Category,Max Wind (km/h),Min Pressure (hPa),Duration (days),Genesis Lat,Genesis Lon,Landfall\n';
        
        const scenarioAName = this.getScenarioDisplayName(scenarioA);
        const scenarioBName = this.getScenarioDisplayName(scenarioB);
        
        cyclonesA.forEach(cyclone => {
            csv += `${scenarioAName},${cyclone.id},${cyclone.name},${cyclone.year},${cyclone.genesis_month || 'N/A'},${cyclone.maxCategory},${cyclone.maxWind},${cyclone.minPressure},${cyclone.duration_days || cyclone.duration},${cyclone.genesis_lat},${cyclone.genesis_lon},${cyclone.landfall ? 'Yes' : 'No'}\n`;
        });
        
        cyclonesB.forEach(cyclone => {
            csv += `${scenarioBName},${cyclone.id},${cyclone.name},${cyclone.year},${cyclone.genesis_month || 'N/A'},${cyclone.maxCategory},${cyclone.maxWind},${cyclone.minPressure},${cyclone.duration_days || cyclone.duration},${cyclone.genesis_lat},${cyclone.genesis_lon},${cyclone.landfall ? 'Yes' : 'No'}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = `cyclone_comparison_${scenarioA}_vs_${scenarioB}`;
        filename += `_ensemble${ensembleA}_vs_${ensembleB}`;
        
        if ((scenarioA === '2k' || scenarioA === '4k') && sstModelA) {
            filename += `_${sstModelA}`;
        }
        if ((scenarioB === '2k' || scenarioB === '4k') && sstModelB) {
            filename += `_${sstModelB}`;
        }
        
        if (yearRange) {
            filename += `_${yearRange.min}-${yearRange.max}`;
        }
        filename += `_${this.formatDate(new Date())}.csv`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported comparison: ${cyclonesA.length} vs ${cyclonesB.length} cyclones`, 'success');
    }
    
    exportToCSV(data, scenario, ensemble, sstModel, yearRange) {
        if (!data || !data.cyclones) {
            this.showNotification('No data to export', 'error');
            return;
        }
        
        let cyclones = data.cyclones;
        
        if (yearRange) {
            cyclones = cyclones.filter(c => 
                c.year >= yearRange.min && c.year <= yearRange.max
            );
        }
        
        let csv = 'ID,Name,Year,Genesis Month,Max Category,Max Wind (km/h),Min Pressure (hPa),Duration (days),Genesis Lat,Genesis Lon,Landfall\n';
        
        cyclones.forEach(cyclone => {
            csv += `${cyclone.id},${cyclone.name},${cyclone.year},${cyclone.genesis_month || 'N/A'},${cyclone.maxCategory},${cyclone.maxWind},${cyclone.minPressure},${cyclone.duration_days || cyclone.duration},${cyclone.genesis_lat},${cyclone.genesis_lon},${cyclone.landfall ? 'Yes' : 'No'}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = `cyclone_data_${scenario}_ensemble${ensemble}`;
        if (scenario === '2k' || scenario === '4k') {
            filename += `_${sstModel}`;
        }
        if (yearRange) {
            filename += `_${yearRange.min}-${yearRange.max}`;
        }
        filename += `_${this.formatDate(new Date())}.csv`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported ${cyclones.length} cyclones to CSV`, 'success');
    }
    
    exportTrackData(cyclones, scenario, ensemble, sstModel) {
        if (!cyclones || cyclones.length === 0) {
            this.showNotification('No track data to export', 'error');
            return;
        }
        
        let csv = 'Cyclone_ID,Name,Year,Track_Point,Date,Latitude,Longitude,Category,Wind_Speed_kmh,Pressure_hPa\n';
        
        cyclones.forEach(cyclone => {
            if (cyclone.track && cyclone.track.length > 0) {
                cyclone.track.forEach((point, index) => {
                    csv += `${cyclone.id},${cyclone.name},${cyclone.year},${index + 1},${point.date},${point.lat},${point.lon},${point.category},${point.windSpeed},${point.pressure}\n`;
                });
            }
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = `cyclone_tracks_${scenario}_ensemble${ensemble}`;
        if (scenario === '2k' || scenario === '4k') {
            filename += `_${sstModel}`;
        }
        filename += `_${this.formatDate(new Date())}.csv`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        const totalPoints = cyclones.reduce((sum, c) => sum + (c.track ? c.track.length : 0), 0);
        this.showNotification(`Exported ${totalPoints} track points from ${cyclones.length} cyclones`, 'success');
    }
    
    exportToGeoJSON(cyclones, scenario, ensemble, sstModel) {
        if (!cyclones || cyclones.length === 0) {
            this.showNotification('No data to export', 'error');
            return;
        }
        
        const geojson = {
            type: "FeatureCollection",
            metadata: {
                scenario: scenario,
                ensemble: ensemble,
                sstModel: sstModel,
                exportDate: new Date().toISOString(),
                cycloneCount: cyclones.length
            },
            features: []
        };
        
        cyclones.forEach(cyclone => {
            if (cyclone.track && cyclone.track.length > 0) {
                const coordinates = cyclone.track.map(point => [point.lon, point.lat]);
                
                const feature = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coordinates
                    },
                    properties: {
                        id: cyclone.id,
                        name: cyclone.name,
                        year: cyclone.year,
                        maxCategory: cyclone.maxCategory,
                        maxWind: cyclone.maxWind,
                        minPressure: cyclone.minPressure,
                        duration: cyclone.duration_days || cyclone.duration,
                        landfall: cyclone.landfall,
                        genesisLat: cyclone.genesis_lat,
                        genesisLon: cyclone.genesis_lon
                    }
                };
                
                geojson.features.push(feature);
            }
        });
        
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = `cyclone_tracks_${scenario}_ensemble${ensemble}`;
        if (scenario === '2k' || scenario === '4k') {
            filename += `_${sstModel}`;
        }
        filename += `_${this.formatDate(new Date())}.geojson`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported ${cyclones.length} cyclones to GeoJSON`, 'success');
    }
    
    exportComparisonToGeoJSON(cyclonesA, cyclonesB, scenarioA, scenarioB, ensembleA, ensembleB, sstModelA, sstModelB) {
        if (!cyclonesA || cyclonesA.length === 0 || !cyclonesB || cyclonesB.length === 0) {
            this.showNotification('No comparison data to export', 'error');
            return;
        }
        
        const geojson = {
            type: "FeatureCollection",
            metadata: {
                comparisonMode: true,
                scenarioA: { scenario: scenarioA, ensemble: ensembleA, sstModel: sstModelA },
                scenarioB: { scenario: scenarioB, ensemble: ensembleB, sstModel: sstModelB },
                exportDate: new Date().toISOString(),
                cycloneCountA: cyclonesA.length,
                cycloneCountB: cyclonesB.length
            },
            features: []
        };
        
        cyclonesA.forEach(cyclone => {
            if (cyclone.track && cyclone.track.length > 0) {
                const coordinates = cyclone.track.map(point => [point.lon, point.lat]);
                
                const feature = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coordinates
                    },
                    properties: {
                        scenario: this.getScenarioDisplayName(scenarioA),
                        scenarioType: 'A',
                        id: cyclone.id,
                        name: cyclone.name,
                        year: cyclone.year,
                        maxCategory: cyclone.maxCategory,
                        maxWind: cyclone.maxWind,
                        minPressure: cyclone.minPressure,
                        duration: cyclone.duration_days || cyclone.duration,
                        landfall: cyclone.landfall,
                        genesisLat: cyclone.genesis_lat,
                        genesisLon: cyclone.genesis_lon
                    }
                };
                
                geojson.features.push(feature);
            }
        });
        
        cyclonesB.forEach(cyclone => {
            if (cyclone.track && cyclone.track.length > 0) {
                const coordinates = cyclone.track.map(point => [point.lon, point.lat]);
                
                const feature = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coordinates
                    },
                    properties: {
                        scenario: this.getScenarioDisplayName(scenarioB),
                        scenarioType: 'B',
                        id: cyclone.id,
                        name: cyclone.name,
                        year: cyclone.year,
                        maxCategory: cyclone.maxCategory,
                        maxWind: cyclone.maxWind,
                        minPressure: cyclone.minPressure,
                        duration: cyclone.duration_days || cyclone.duration,
                        landfall: cyclone.landfall,
                        genesisLat: cyclone.genesis_lat,
                        genesisLon: cyclone.genesis_lon
                    }
                };
                
                geojson.features.push(feature);
            }
        });
        
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = `cyclone_comparison_${scenarioA}_vs_${scenarioB}`;
        filename += `_ensemble${ensembleA}_vs_${ensembleB}`;
        
        if ((scenarioA === '2k' || scenarioA === '4k') && sstModelA) {
            filename += `_${sstModelA}`;
        }
        if ((scenarioB === '2k' || scenarioB === '4k') && sstModelB) {
            filename += `_${sstModelB}`;
        }
        
        filename += `_${this.formatDate(new Date())}.geojson`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported comparison: ${cyclonesA.length} vs ${cyclonesB.length} cyclones to GeoJSON`, 'success');
    }
    
    getScenarioDisplayName(scenario) {
        const names = {
            'current': 'Historical',
            'nat': 'Natural',
            '2k': '2K_Warming',
            '4k': '4K_Warming'
        };
        return names[scenario] || scenario;
    }
    
    formatDate(date, format = 'YYYY-MM-DD') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }
    
    formatDateTime(date) {
        return date.toISOString().replace('T', ' ').substring(0, 19);
    }
    
    parseDate(dateString) {
        return new Date(dateString);
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    calculateBearing(lat1, lon1, lat2, lon2) {
        const dLon = this.toRadians(lon2 - lon1);
        const lat1Rad = this.toRadians(lat1);
        const lat2Rad = this.toRadians(lat2);
        
        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                 Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
        
        return (this.toDegrees(Math.atan2(y, x)) + 360) % 360;
    }
    
    validateLatitude(lat) {
        return typeof lat === 'number' && lat >= -90 && lat <= 90;
    }
    
    validateLongitude(lon) {
        return typeof lon === 'number' && lon >= -180 && lon <= 180;
    }
    
    validateCategory(category) {
        return Number.isInteger(category) && category >= 0 && category <= 5;
    }
    
    validateYear(year) {
        return Number.isInteger(year) && year >= 1900 && year <= 2200;
    }
    
    filterCyclonesByBounds(cyclones, bounds) {
        return cyclones.filter(cyclone => {
            if (!cyclone.track || cyclone.track.length === 0) return false;
            
            return cyclone.track.some(point => 
                point.lat >= bounds.south && 
                point.lat <= bounds.north &&
                point.lon >= bounds.west && 
                point.lon <= bounds.east
            );
        });
    }
    
    getCycloneStatistics(cyclones) {
        if (!cyclones || cyclones.length === 0) {
            return {
                count: 0,
                averageCategory: 0,
                averageWindSpeed: 0,
                averagePressure: 0,
                landfallCount: 0,
                categoryDistribution: {}
            };
        }
        
        const stats = {
            count: cyclones.length,
            totalCategory: 0,
            totalWindSpeed: 0,
            totalPressure: 0,
            landfallCount: 0,
            categoryDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        cyclones.forEach(cyclone => {
            stats.totalCategory += cyclone.maxCategory || 0;
            stats.totalWindSpeed += cyclone.maxWind || 0;
            stats.totalPressure += cyclone.minPressure || 0;
            
            if (cyclone.landfall) stats.landfallCount++;
            
            const category = cyclone.maxCategory;
            if (category >= 1 && category <= 5) {
                stats.categoryDistribution[category]++;
            }
        });
        
        return {
            count: stats.count,
            averageCategory: (stats.totalCategory / stats.count).toFixed(1),
            averageWindSpeed: Math.round(stats.totalWindSpeed / stats.count),
            averagePressure: Math.round(stats.totalPressure / stats.count),
            landfallCount: stats.landfallCount,
            landfallPercentage: ((stats.landfallCount / stats.count) * 100).toFixed(1),
            categoryDistribution: stats.categoryDistribution
        };
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    slugify(str) {
        return str.toLowerCase()
                 .replace(/[^\w\s-]/g, '')
                 .replace(/[\s_-]+/g, '-')
                 .replace(/^-+|-+$/g, '');
    }
    
    truncate(str, length = 50, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    interpolateColor(color1, color2, factor) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
        const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
        const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }
    
    updateQueryParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }
    
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    isTablet() {
        return window.innerWidth <= 1024 && window.innerWidth > 768;
    }
    
    isDesktop() {
        return window.innerWidth > 1024;
    }
    
    getTouchSupport() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    setSessionData(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save session data:', e);
        }
    }
    
    getSessionData(key) {
        try {
            const data = sessionStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Failed to read session data:', e);
            return null;
        }
    }
    
    clearSessionData(key = null) {
        try {
            if (key) {
                sessionStorage.removeItem(key);
            } else {
                sessionStorage.clear();
            }
        } catch (e) {
            console.warn('Failed to clear session data:', e);
        }
    }
    
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        this.showNotification(`An error occurred in ${context}. Please try again.`, 'error');
    }
    
    reportError(error, context) {
        console.log('Error reported:', { error, context, timestamp: new Date().toISOString() });
    }
}