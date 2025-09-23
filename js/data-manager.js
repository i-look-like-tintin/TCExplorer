class DataManager {
    constructor(app) {
        this.app = app;
        this.cache = new Map();
        this.loadingQueue = new Set();
        this.comparisonDataA = null;
        this.comparisonDataB = null;
    }
    
    getCacheKey(scenario = null, ensemble = null, sstModel = null) {
        const s = scenario || this.app.currentScenario;
        const e = ensemble || this.app.currentEnsemble;
        const sst = sstModel || this.app.currentSSTModel;
        
        if (s === 'current' || s === 'nat') {
            return `${s}_${e}`;
        } else {
            return `${s}_${e}_${sst}`;
        }
    }
    
    getComparisonCacheKey(scenarioType) {
        if (scenarioType === 'A') {
            return this.getCacheKey(
                this.app.comparisonScenarioA, 
                this.app.comparisonEnsembleA, 
                this.app.comparisonSSTModelA
            );
        } else {
            return this.getCacheKey(
                this.app.comparisonScenarioB, 
                this.app.comparisonEnsembleB, 
                this.app.comparisonSSTModelB
            );
        }
    }
    
    async loadComparisonData(scenarioA, ensembleA, sstModelA, scenarioB, ensembleB, sstModelB) {
        const cacheKeyA = this.getCacheKey(scenarioA, ensembleA, sstModelA);
        const cacheKeyB = this.getCacheKey(scenarioB, ensembleB, sstModelB);
        
        const loadPromises = [];
        
        if (!this.app.cycloneData[cacheKeyA]) {
            loadPromises.push(this.loadSpecificScenario(scenarioA, ensembleA, sstModelA, cacheKeyA));
        }
        
        if (!this.app.cycloneData[cacheKeyB]) {
            loadPromises.push(this.loadSpecificScenario(scenarioB, ensembleB, sstModelB, cacheKeyB));
        }
        
        if (loadPromises.length > 0) {
            await Promise.all(loadPromises);
        }
        
        this.comparisonDataA = this.app.cycloneData[cacheKeyA];
        this.comparisonDataB = this.app.cycloneData[cacheKeyB];
        
        this.updateComparisonDataStatus();
    }
    
    async loadSpecificScenario(scenario, ensemble, sstModel, cacheKey) {
        if (this.loadingQueue.has(cacheKey)) {
            return;
        }
        
        try {
            this.loadingQueue.add(cacheKey);
            
            const params = this.buildAPIParams(scenario, ensemble, sstModel);
            console.log(`Loading ${scenario} data with params:`, params.toString());
            
            const response = await fetch(`php/api.php?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.app.cycloneData[cacheKey] = data.data;
                console.log(`Loaded ${data.data.cyclones.length} cyclones for ${scenario}`);
            } else {
                throw new Error(data.error || 'Unknown API error');
            }
            
        } catch (error) {
            console.error(`Error loading data for ${scenario}:`, error);
            throw error;
        } finally {
            this.loadingQueue.delete(cacheKey);
        }
    }
    
    async loadData(forceRefresh = false) {
        if (this.app.comparisonMode) {
            return;
        }
        
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
    
    buildAPIParams(scenario = null, ensemble = null, sstModel = null) {
        const s = scenario || this.app.currentScenario;
        const e = ensemble || this.app.currentEnsemble;
        const sst = sstModel || this.app.currentSSTModel;
        
        const params = new URLSearchParams({
            action: 'getCycloneData',
            scenario: s,
            ensemble: e,
            filter: 'all',
            use_sample: 'false',
            debug: 'true'
        });
        
        if (s === '2k' || s === '4k') {
            params.append('sst', sst);
        }
        
        return params;
    }
    
    getComparisonData(scenarioType) {
        if (scenarioType === 'A') {
            return this.comparisonDataA;
        } else if (scenarioType === 'B') {
            return this.comparisonDataB;
        }
        return null;
    }
    
    updateComparisonDataStatus() {
        if (this.comparisonDataA && this.comparisonDataB) {
            const countA = this.comparisonDataA.cyclones.length;
            const countB = this.comparisonDataB.cyclones.length;
            
            const scenarioAName = this.getScenarioDisplayName(this.app.comparisonScenarioA);
            const scenarioBName = this.getScenarioDisplayName(this.app.comparisonScenarioB);
            
            this.updateDataStatus(
                `Comparison: ${scenarioAName} (${countA}) vs ${scenarioBName} (${countB})`, 
                'success'
            );
        }
    }
    
    getScenarioDisplayName(scenario) {
        const names = {
            'current': 'Historical',
            'nat': 'Natural',
            '2k': '+2K',
            '4k': '+4K'
        };
        return names[scenario] || scenario;
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
        if (this.app.comparisonMode) {
            return {
                A: this.comparisonDataA,
                B: this.comparisonDataB
            };
        }
        
        const cacheKey = this.getCacheKey();
        return this.app.cycloneData[cacheKey];
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
        if (this.app.comparisonMode) {
            const dataA = this.getComparisonData('A');
            const dataB = this.getComparisonData('B');
            
            return {
                comparisonMode: true,
                scenarioA: {
                    scenario: this.app.comparisonScenarioA,
                    ensemble: this.app.comparisonEnsembleA,
                    sstModel: this.app.comparisonSSTModelA,
                    metrics: dataA ? this.calculateMetrics(dataA.cyclones) : null
                },
                scenarioB: {
                    scenario: this.app.comparisonScenarioB,
                    ensemble: this.app.comparisonEnsembleB,
                    sstModel: this.app.comparisonSSTModelB,
                    metrics: dataB ? this.calculateMetrics(dataB.cyclones) : null
                }
            };
        }
        
        const data = this.getCurrentData();
        if (!data || !data.cyclones) return null;
        
        const metrics = this.calculateMetrics(data.cyclones);
        
        return {
            comparisonMode: false,
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
        
        this.comparisonDataA = null;
        this.comparisonDataB = null;
        
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