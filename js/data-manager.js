class DataManager {
    constructor(app) {
        this.app = app;
        this.cache = new Map();
        this.loadingQueue = new Set();
    }
    
    getCacheKey() {
        if (this.app.currentScenario === 'current' || this.app.currentScenario === 'nat') {
            return `${this.app.currentScenario}_${this.app.currentEnsemble}`;
        } else {
            return `${this.app.currentScenario}_${this.app.currentEnsemble}_${this.app.currentSSTModel}`;
        }
    }
    
    async loadData(forceRefresh = false) {
        const cacheKey = this.getCacheKey();
        
        if (this.loadingQueue.has(cacheKey)) {
            console.log('Data already loading for:', cacheKey);
            return;
        }
        
        try {
            this.app.showLoading(true);
            this.updateDataStatus('Loading data...');
            
            if (!forceRefresh && this.app.cycloneData[cacheKey]) {
                console.log('Using cached data for:', cacheKey);
                await this.app.updateVisualization();
                return;
            }
            
            this.loadingQueue.add(cacheKey);
            
            const params = this.buildAPIParams();
            console.log('Fetching data with params:', params.toString());
            
            const response = await fetch(`php/api.php?${params}`);
            const data = await response.json();
            
            console.log('API Response:', data);
            
            if (data.success) {
                this.app.cycloneData[cacheKey] = data.data;
                this.updateSourceFileDisplay(data.data);
                await this.app.updateVisualization();
                this.showDataInfo(data.data);
            } else {
                console.error('Failed to load data:', data.error);
                this.updateDataStatus('Failed to load data', 'error');
                throw new Error(data.error || 'Unknown API error');
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.updateDataStatus('Error loading data', 'error');
            this.app.utils.showNotification('Failed to load cyclone data. Please try again.', 'error');
        } finally {
            this.loadingQueue.delete(cacheKey);
            this.app.showLoading(false);
        }
    }
    
    buildAPIParams() {
        const params = new URLSearchParams({
            action: 'getCycloneData',
            scenario: this.app.currentScenario,
            ensemble: this.app.currentEnsemble,
            filter: this.app.filterAustralia ? 'australia' : 'all',
            use_sample: 'false',
            debug: 'true'
        });
        
        if (this.app.currentScenario === '2k' || this.app.currentScenario === '4k') {
            params.append('sst', this.app.currentSSTModel);
        }
        
        return params;
    }
    
    async fetchPrecomputedDensity(scenario, ensemble, sstModel) {
        try {
            let filename = 'density_data/';
            
            switch(scenario) {
                case 'current':
                    const ensembleNumCurrent = String(ensemble).padStart(3, '0');
                    filename += `density_HPB_m${ensembleNumCurrent}_1951-2011.txt`;
                    break;
                    
                case 'nat':
                    const ensembleNumNat = String(ensemble).padStart(3, '0');
                    filename += `density_HPB_NAT_m${ensembleNumNat}_1951-2010.txt`;
                    break;
                    
                case '2k':
                    const ensembleNum2K = 100 + ensemble;
                    const ensembleStr2K = String(ensembleNum2K).padStart(3, '0');
                    const sst2K = sstModel || 'CC';
                    filename += `density_HFB_2K_${sst2K}_m${ensembleStr2K}_2031-2090.txt`;
                    break;
                    
                case '4k':
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
            
            this.app.utils.showNotification(errorMsg, 'warning');
            return null;
        }
    }
    
    parseDensityCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) continue;
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index];
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
    
    getCurrentData() {
        const cacheKey = this.getCacheKey();
        return this.app.cycloneData[cacheKey];
    }
    
    filterCyclones(cyclones, filters = {}) {
        let filtered = [...cyclones];
        
        if (filters.yearRange) {
            filtered = filtered.filter(c => 
                c.year >= filters.yearRange.min && c.year <= filters.yearRange.max
            );
        }
        
        if (filters.minCategory) {
            filtered = filtered.filter(c => c.maxCategory >= filters.minCategory);
        }
        
        if (filters.region === 'australia') {
            filtered = filtered.filter(c => this.hasAustralianTrack(c));
        }
        
        if (filters.landfallOnly) {
            filtered = filtered.filter(c => c.landfall);
        }
        
        return filtered;
    }
    
    hasAustralianTrack(cyclone) {
        if (!cyclone.track || cyclone.track.length === 0) return false;
        
        return cyclone.track.some(point => 
            this.app.mapManager.isInAustralianRegion(point.lat, point.lon)
        );
    }
    
    updateDataStatus(message, type = 'info') {
        const statusEl = document.getElementById('data-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? '#e74c3c' : 
                                  type === 'success' ? '#27ae60' : '#7f8c8d';
        }
    }
    
    updateSourceFileDisplay(data) {
        const sourceEl = document.getElementById('source-file');
        if (sourceEl && data.metadata && data.metadata.source_file) {
            sourceEl.textContent = data.metadata.source_file;
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
    
    calculateMetrics(cyclones) {
        const metrics = {
            totalCyclones: cyclones.length,
            severeCyclones: 0,
            avgMaxCategory: 0,
            maxWindSpeed: 0,
            landfallCount: 0,
            yearRange: { min: Infinity, max: -Infinity },
            categoryDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        let totalCategory = 0;
        
        cyclones.forEach(cyclone => {
            if (cyclone.maxCategory >= 3) {
                metrics.severeCyclones++;
            }
            totalCategory += cyclone.maxCategory || 0;
            
            if (cyclone.maxCategory >= 1 && cyclone.maxCategory <= 5) {
                metrics.categoryDistribution[cyclone.maxCategory]++;
            }
            
            metrics.maxWindSpeed = Math.max(metrics.maxWindSpeed, cyclone.maxWind || 0);
            
            if (cyclone.landfall) {
                metrics.landfallCount++;
            }
            
            if (cyclone.year) {
                metrics.yearRange.min = Math.min(metrics.yearRange.min, cyclone.year);
                metrics.yearRange.max = Math.max(metrics.yearRange.max, cyclone.year);
            }
        });
        
        metrics.avgMaxCategory = cyclones.length > 0 ? (totalCategory / cyclones.length).toFixed(1) : 0;
        
        if (metrics.yearRange.min === Infinity) {
            metrics.yearRange = { min: 0, max: 0 };
        }
        
        return metrics;
    }
    
    getDataSummary() {
        const data = this.getCurrentData();
        if (!data || !data.cyclones) return null;
        
        const metrics = this.calculateMetrics(data.cyclones);
        
        return {
            scenario: this.app.currentScenario,
            ensemble: this.app.currentEnsemble,
            sstModel: this.app.currentSSTModel,
            metadata: data.metadata,
            metrics: metrics,
            dataSource: data.data_source || 'unknown'
        };
    }
    
    clearCache(scenario = null) {
        if (scenario) {
            Object.keys(this.app.cycloneData).forEach(key => {
                if (key.startsWith(scenario)) {
                    delete this.app.cycloneData[key];
                }
            });
        } else {
            this.app.cycloneData = {};
        }
        console.log('Cache cleared for:', scenario || 'all scenarios');
    }
    
    async preloadCommonScenarios() {
        const commonScenarios = [
            { scenario: 'current', ensemble: 1 },
            { scenario: 'nat', ensemble: 1 },
            { scenario: '2k', ensemble: 1, sst: 'CC' },
            { scenario: '4k', ensemble: 1, sst: 'CC' }
        ];
        
        for (const config of commonScenarios) {
            try {
                const originalScenario = this.app.currentScenario;
                const originalEnsemble = this.app.currentEnsemble;
                const originalSST = this.app.currentSSTModel;
                
                this.app.currentScenario = config.scenario;
                this.app.currentEnsemble = config.ensemble;
                if (config.sst) this.app.currentSSTModel = config.sst;
                
                await this.loadData();
                
                this.app.currentScenario = originalScenario;
                this.app.currentEnsemble = originalEnsemble;
                this.app.currentSSTModel = originalSST;
                
            } catch (error) {
                console.warn('Failed to preload scenario:', config, error);
            }
        }
    }
}