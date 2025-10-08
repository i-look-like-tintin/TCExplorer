const TCConfig = {
    app: {
        name: 'Tropical Cyclone Track Visualization',
        version: '1.0.4a',
        description: 'd4PDF Climate Model Projections for Australia',
        author: 'Team 7 Sharks',
        buildDate: '2025-10-08'
    },
    
    api: {
        baseUrl: 'php/api.php',
        timeout: 60000,
        retryAttempts: 3,
        retryDelay: 1000,
        cacheLifetime: 3600000,
        debugMode: false
    },
    
    map: {
        defaultCenter: [-25.2744, 133.7751],
        defaultZoom: 4,
        minZoom: 3,
        maxZoom: 10,
        tileLayer: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'TC Explorer created by Team 7 Sharks',
            options: {
                noWrap: false,
                maxZoom: 18
            }
        },
        australiaBounds: {
            north: -5,
            south: -45,
            east: 160,
            west: 105
        }
    },
    
    scenarios: {
        current: {
            id: 'current',
            name: 'Historical (1951-2011)',
            description: 'Historical Climate (Past Experiments)',
            yearRange: { min: 1951, max: 2011 },
            ensembleRange: { min: 1, max: 100 },
            warming: '0K',
            model: 'd4PDF HPB',
            color: '#2c3e50',
            requiresSST: false
        },
        nat: {
            id: 'nat',
            name: 'Natural (1951-2010)',
            description: 'Natural Climate (No Anthropogenic Warming)',
            yearRange: { min: 1951, max: 2010 },
            ensembleRange: { min: 1, max: 100 },
            warming: 'Natural Only',
            model: 'd4PDF HPB NAT',
            color: '#27ae60',
            requiresSST: false
        },
        '2k': {
            id: '2k',
            name: '+2K Warming (2031-2090)',
            description: '+2K Global Warming Scenario',
            yearRange: { min: 2031, max: 2090 },
            ensembleRange: { min: 1, max: 9 },
            actualEnsembleRange: { min: 101, max: 109 },
            warming: '+2K',
            model: 'd4PDF HFB_2K',
            color: '#e67e22',
            requiresSST: true,
            sstModels: ['CC', 'GF', 'HA', 'MI', 'MP', 'MR']
        },
        '4k': {
            id: '4k',
            name: '+4K Warming (2051-2110)',
            description: '+4K Global Warming Scenario',
            yearRange: { min: 2051, max: 2110 },
            ensembleRange: { min: 1, max: 15 },
            actualEnsembleRange: { min: 101, max: 115 },
            warming: '+4K',
            model: 'd4PDF HFB_4K',
            color: '#c0392b',
            requiresSST: true,
            sstModels: ['CC', 'GF', 'HA', 'MI', 'MP', 'MR']
        }
    },
    
    sstModels: {
        CC: {
            id: 'CC',
            name: 'CCSM4',
            fullName: 'Community Climate System Model 4',
            description: 'NCAR Community Climate System Model'
        },
        GF: {
            id: 'GF',
            name: 'GFDL-CM3',
            fullName: 'Geophysical Fluid Dynamics Laboratory Climate Model 3',
            description: 'NOAA/GFDL Climate Model'
        },
        HA: {
            id: 'HA',
            name: 'HadGEM-AO2',
            fullName: 'Hadley Centre Global Environmental Model',
            description: 'UK Met Office Climate Model'
        },
        MI: {
            id: 'MI',
            name: 'MIROC5',
            fullName: 'Model for Interdisciplinary Research on Climate 5',
            description: 'Japanese Climate Model'
        },
        MP: {
            id: 'MP',
            name: 'MPI-ESM-MR',
            fullName: 'Max Planck Institute Earth System Model',
            description: 'German Climate Model'
        },
        MR: {
            id: 'MR',
            name: 'MRI-CGCM3',
            fullName: 'Meteorological Research Institute Climate Model 3',
            description: 'Japanese Meteorological Agency Model'
        }
    },
    
    intensityCategories: {
        0: {
            name: 'Tropical Depression',
            minWind: 0,
            maxWind: 62,
            color: '#999999',
            description: 'Below tropical cyclone intensity'
        },
        1: {
            name: 'Category 1',
            minWind: 63,
            maxWind: 88,
            color: '#1f78b4',
            description: 'Typical house roofing damage'
        },
        2: {
            name: 'Category 2',
            minWind: 89,
            maxWind: 117,
            color: '#33a02c',
            description: 'Minor structural damage'
        },
        3: {
            name: 'Category 3',
            minWind: 118,
            maxWind: 159,
            color: '#ff7f00',
            description: 'Some structural damage'
        },
        4: {
            name: 'Category 4',
            minWind: 160,
            maxWind: 199,
            color: '#e31a1c',
            description: 'Significant structural damage'
        },
        5: {
            name: 'Category 5',
            minWind: 200,
            maxWind: 999,
            color: '#6a3d9a',
            description: 'Extremely dangerous, widespread destruction'
        }
    },
    
    heatmap: {
        density: {
            levels: [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 75, 100],
            colors: [
                'rgba(255, 255, 255, 0)',
                'rgba(254, 254, 217, 0.7)',
                'rgba(254, 248, 195, 0.75)',
                'rgba(254, 235, 162, 0.8)', 
                'rgba(254, 217, 118, 0.85)',
                'rgba(254, 196, 79, 0.85)', 
                'rgba(254, 173, 67, 0.9)', 
                'rgba(252, 141, 60, 0.9)',
                'rgba(248, 105, 51, 0.9)', 
                'rgba(238, 75, 43, 0.95)',
                'rgba(220, 50, 32, 0.95)', 
                'rgba(187, 21, 26, 0.95)',
                'rgba(145, 0, 13, 1)',  
                'rgba(103, 0, 13, 1)'
            ],
            gridResolution: 2
        },
        precomputed: {
            levels: [0, 1, 2, 5, 10, 20, 40, 80, 120, 160],
            colors: [
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
            ]
        }
    },
    
    dataProcessing: {
        maxCyclonesToDisplay: {
            desktop: 1000,
            tablet: 500,
            mobile: 200
        },
        trackSimplification: {
            tolerance: 0.01,
            minPoints: 3,
            maxPoints: 20
        },
        filterDefaults: {
            minCategory: 1,
            australiaRegion: true,
            landfallBuffer: 50
        }
    },
    
    performance: {
        animationDuration: {
            high: 300,
            medium: 150,
            low: 50
        },
        debounceDelay: {
            resize: 250,
            search: 300,
            slider: 100
        },
        cacheSize: {
            maxEntries: 50,
            maxAge: 3600000
        }
    },
    
    ui: {
        breakpoints: {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            largeDesktop: 1440
        },
        notifications: {
            defaultDuration: 5000,
            positions: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
            defaultPosition: 'top-right'
        },
        panels: {
            autoHideDelay: 10000,
            animationDuration: 300
        }
    },
    
    export: {
        formats: ['csv', 'json', 'geojson'],
        maxRecords: 10000,
        dateFormat: 'YYYY-MM-DD',
        csvDelimiter: ',',
        filenameTemplate: 'cyclone_data_{scenario}_ensemble{ensemble}_{date}'
    },
    
    features: {
        ensembleSelection: true,
        trackAnimation: true,
        densityMaps: true,
        precomputedHeatmaps: true,
        statisticalAnalysis: true,
        userAuthentication: false,
        advancedFiltering: true,
        dataExport: true,
        responsiveDesign: true,
        touchOptimization: true,
        performanceMonitoring: true,
        errorReporting: false
    },
    
    external: {
        australiaBoundaries: {
            url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
            cache: true,
            fallback: true
        },
        densityData: {
            basePath: 'density_data/',
            filePattern: {
                current: 'density_HPB_m{ensemble}_1951-2011.txt',
                nat: 'density_HPB_NAT_m{ensemble}_1951-2010.txt',
                '2k': 'density_HFB_2K_{sst}_m{ensemble}_2031-2090.txt',
                '4k': 'density_HFB_4K_{sst}_m{ensemble}_2051-2110.txt'
            }
        }
    },
    
    errors: {
        maxRetries: 3,
        retryDelay: 1000,
        showUserFriendlyMessages: true,
        logToConsole: true,
        reportToService: false,
        fallbackBehavior: 'graceful'
    },
    
    development: {
        debugMode: false,
        verboseLogging: false,
        showPerformanceMetrics: false,
        enableDevTools: false,
        mockData: false
    }
};

const TCConfigUtils = {
    getScenario(scenarioId) {
        return TCConfig.scenarios[scenarioId] || null;
    },
    
    getSST(sstId) {
        return TCConfig.sstModels[sstId] || null;
    },
    
    getIntensityCategory(category) {
        return TCConfig.intensityCategories[category] || TCConfig.intensityCategories[0];
    },
    
    isFeatureEnabled(featureName) {
        return TCConfig.features[featureName] === true;
    },
    
    getDeviceConfig(deviceType) {
        const configs = {
            mobile: {
                maxCyclones: TCConfig.dataProcessing.maxCyclonesToDisplay.mobile,
                animationDuration: TCConfig.performance.animationDuration.low,
                gridResolution: 4
            },
            tablet: {
                maxCyclones: TCConfig.dataProcessing.maxCyclonesToDisplay.tablet,
                animationDuration: TCConfig.performance.animationDuration.medium,
                gridResolution: 3
            },
            desktop: {
                maxCyclones: TCConfig.dataProcessing.maxCyclonesToDisplay.desktop,
                animationDuration: TCConfig.performance.animationDuration.high,
                gridResolution: 2
            }
        };
        
        return configs[deviceType] || configs.desktop;
    },
    
    getCategoryColor(category) {
        const cat = this.getIntensityCategory(category);
        return cat ? cat.color : '#999999';
    },
    
    getHeatmapColor(value, type = 'density') {
        const config = TCConfig.heatmap[type];
        if (!config) return 'rgba(255, 255, 255, 0)';
        
        for (let i = config.levels.length - 1; i >= 0; i--) {
            if (value >= config.levels[i]) {
                return config.colors[i];
            }
        }
        return config.colors[0];
    },
    
    validateScenario(scenarioId) {
        const scenario = this.getScenario(scenarioId);
        if (!scenario) return false;
        
        return scenario.yearRange && 
               scenario.ensembleRange && 
               scenario.name && 
               scenario.description;
    },
    
    getAPIEndpoint(action = '') {
        return action ? `${TCConfig.api.baseUrl}?action=${action}` : TCConfig.api.baseUrl;
    },
    
    getExportFilename(scenario, ensemble, sstModel = null, format = 'csv') {
        let filename = TCConfig.export.filenameTemplate
            .replace('{scenario}', scenario)
            .replace('{ensemble}', ensemble)
            .replace('{date}', new Date().toISOString().split('T')[0]);
        
        if (sstModel && (scenario === '2k' || scenario === '4k')) {
            filename += `_${sstModel}`;
        }
        
        return `${filename}.${format}`;
    },
    
    mergeConfig(userConfig) {
        return this.deepMerge(TCConfig, userConfig);
    },
    
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
};

if (typeof window !== 'undefined') {
    window.TCConfig = TCConfig;
    window.TCConfigUtils = TCConfigUtils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TCConfig, TCConfigUtils };
}
