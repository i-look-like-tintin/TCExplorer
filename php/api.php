<?php

// Enable gzip compression for JSON responses to speed up large data transfers
// This reduces 72MB JSON responses to ~8-10MB (80-90% reduction)
if (extension_loaded('zlib') &&
    !ob_get_level() &&
    strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false) {
    ob_start('ob_gzhandler');
}

require_once 'config.php';
require_once 'Dp4dfParser.php';
require_once 'IBTraCSParser.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Content-Type: application/json');

class CycloneDataAPI {
    private $dataPath;
    private $scenarios = ['current', 'nat', '2k', '4k'];
    private $parser;
    
    public function __construct() {
        $this->dataPath = DATA_PATH;
        try {
            $this->parser = new Dp4dfParser();
        } catch (Exception $e) {
            error_log("Failed to create Dp4dfParser: " . $e->getMessage());
            $this->parser = null;
        }
    }
    
    public function handleRequest() {
        $action = $_GET['action'] ?? '';
        $scenario = $_GET['scenario'] ?? 'current';

        // Scenario validation not required for real historical data
        if ($action !== 'getRealHistoricalData' && $action !== 'test') {
            if (!in_array($scenario, $this->scenarios)) {
                $this->sendError('Invalid scenario');
                return;
            }
        }

        switch ($action) {
            case 'getCycloneData':
                $this->getCycloneData($scenario);
                break;
            case 'getRealHistoricalData':
                $this->getRealHistoricalData();
                break;
            case 'getScenarioMetadata':
                $this->getScenarioMetadata($scenario);
                break;
            case 'getAvailableEnsembles':
                $this->getAvailableEnsembles($scenario);
                break;
            case 'test':
                $this->testConnection();
                break;
            default:
                $this->sendError('Invalid action');
        }
    }
    
    private function testConnection() {
        $testUrl = DP4DF_BASE_URL . 'xytrackk319b_HPB_m001_1951-2011.txt';
        $headers = @get_headers($testUrl);
        
        $this->sendSuccess([
            'test' => 'connection',
            'base_url' => DP4DF_BASE_URL,
            'test_file' => 'xytrackk319b_HPB_m001_1951-2011.txt',
            'connection_success' => ($headers && strpos($headers[0], '200') !== false),
            'cache_dir_exists' => is_dir(CACHE_PATH . 'dp4df/'),
            'cache_dir_writable' => is_writable(CACHE_PATH . 'dp4df/'),
            'php_version' => PHP_VERSION
        ]);
    }
    
    private function getCycloneData($scenario) {
        $ensembleId = isset($_GET['ensemble']) ? (int)$_GET['ensemble'] : 1;
        $sstModel = $_GET['sst'] ?? null;
        
        if (($scenario === '2k' || $scenario === '4k') && !$sstModel) {
            $sstModel = 'CC';
        }
        
        $debug = isset($_GET['debug']) && $_GET['debug'] === 'true';
        $useSample = isset($_GET['use_sample']) && $_GET['use_sample'] === 'true';
        
        if (!$useSample) {
            if ($this->parser === null) {
                error_log("API: Parser is null, cannot fetch d4PDF data");
            } else {
                if ($debug) {
                    error_log("API: Attempting to fetch d4PDF data for scenario: $scenario, ensemble: $ensembleId, SST: " . ($sstModel ?? 'none'));
                }
                
                $cyclones = $this->parser->getCycloneData($scenario, $ensembleId, $sstModel);
                
                if ($cyclones !== null) {
                    if ($debug) {
                        error_log("API: Successfully got " . count($cyclones) . " cyclones from d4PDF");
                    }
                    
                    if (isset($_GET['filter']) && $_GET['filter'] === 'australia') {
                        $beforeFilter = count($cyclones);
                        $cyclones = $this->filterToAustralianRegion($cyclones);
                        if ($debug) {
                            error_log("API: Filtered from $beforeFilter to " . count($cyclones) . " cyclones (Australian region)");
                        }
                    }
                    
                    $metadata = $this->getMetadata($scenario);
                    $metadata['source_file'] = $this->parser->getLastFilename();

                    if ($sstModel && ($scenario === '2k' || $scenario === '4k')) {
                        $metadata['sst_model'] = $sstModel;
                    }
                    
                    $data = [
                        'scenario' => $scenario,
                        'metadata' => $metadata,
                        'ensemble_id' => $ensembleId,
                        'data_source' => 'd4pdf',
                        'total_cyclones' => count($cyclones),
                        'cyclones' => $cyclones
                    ];
                    
                    $this->sendSuccess($data);
                    return;
                } else {
                    if ($debug) {
                        error_log("API: Failed to get d4PDF data, falling back to sample data");
                    }
                }
            }
        }
        
        $jsonFile = DATA_PATH . "sample_{$scenario}_cyclones.json";
        if (file_exists($jsonFile)) {
            if ($debug) {
                error_log("API: Using sample data from: $jsonFile");
            }
            $jsonData = json_decode(file_get_contents($jsonFile), true);
            $processedData = $this->processJsonData($jsonData, $scenario);
            $processedData['data_source'] = 'sample';
            $this->sendSuccess($processedData);
            return;
        }
        
        $this->sendError('Failed to load cyclone data from d4PDF server and no sample data available');
    }

    private function getRealHistoricalData() {
        $debug = isset($_GET['debug']) && $_GET['debug'] === 'true';
        $basin = $_GET['basin'] ?? 'all';
        $region = $_GET['region'] ?? 'australian';

        try {
            // Increase memory limit for global region to handle large dataset
            if ($region === 'global') {
                ini_set('memory_limit', '1G');
                if ($debug) {
                    error_log("API: Increased memory limit to 1G for global region");
                }
            }

            if ($debug) {
                error_log("API: Fetching real historical data from IBTrACS (basin: $basin, region: $region)");
            }

            $parser = new IBTraCSParser(CACHE_PATH);
            $cyclones = $parser->getCycloneData($basin, $region);

            if ($cyclones === null) {
                $error = $parser->getLastError();
                throw new Exception($error ?? 'Failed to fetch IBTrACS data');
            }

            if ($debug) {
                error_log("API: Successfully got " . count($cyclones) . " real historical cyclones for region: $region");
            }

            // Calculate year range
            $years = array_column($cyclones, 'year');
            $minYear = !empty($years) ? min($years) : null;
            $maxYear = !empty($years) ? max($years) : null;

            // Region descriptions for metadata
            $regionDescriptions = [
                'australian' => 'Australian Region (105°E-160°E, 45°S-5°S)',
                'global' => 'Global (All Regions)',
                'north_atlantic' => 'North Atlantic (100°W-0°E, 0°N-60°N)',
                'western_pacific' => 'Western Pacific (100°E-180°E, 0°N-60°N)',
                'eastern_pacific' => 'Eastern Pacific (180°W-75°W, 0°N-60°N)',
                'north_indian' => 'North Indian (30°E-100°E, 0°N-40°N)',
                'south_indian' => 'South Indian (20°E-115°E, 40°S-0°)',
                'south_pacific' => 'South Pacific (135°E-120°W, 40°S-0°)'
            ];

            $metadata = [
                'description' => 'Real Historical Cyclone Observations',
                'period' => ($minYear && $maxYear) ? "$minYear-$maxYear" : 'Unknown',
                'min_year' => $minYear,
                'max_year' => $maxYear,
                'source' => 'IBTrACS v04r01 (includes BoM data)',
                'source_agency' => 'NOAA National Centers for Environmental Information',
                'data_url' => 'https://www.ncei.noaa.gov/products/international-best-track-archive',
                'basin' => $basin,
                'region_id' => $region,
                'region' => $regionDescriptions[$region] ?? 'Unknown Region'
            ];

            $data = [
                'scenario' => 'real-historical',
                'metadata' => $metadata,
                'data_source' => 'ibtracs',
                'total_cyclones' => count($cyclones),
                'cyclones' => $cyclones
            ];

            $this->sendSuccess($data);

        } catch (Exception $e) {
            error_log("API Error (getRealHistoricalData): " . $e->getMessage());
            $this->sendError('Failed to load real historical data: ' . $e->getMessage());
        }
    }

    private function filterToAustralianRegion($cyclones) {
        $filtered = [];
        
        foreach ($cyclones as $cyclone) {
            $inRegion = false;
            foreach ($cyclone['track'] as $point) {
                if ($point['lat'] >= BOUNDS['south'] && $point['lat'] <= BOUNDS['north'] &&
                    $point['lon'] >= BOUNDS['west'] && $point['lon'] <= BOUNDS['east']) {
                    $inRegion = true;
                    break;
                }
            }
            
            if ($inRegion) {
                $filtered[] = $cyclone;
            }
        }
        
        return $filtered;
    }
    
    private function getMetadata($scenario) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        
        $metadata = [
            'current' => [
                'description' => 'Historical Climate (Past Experiments)',
                'period' => $config['time_period'],
                'warming' => '0K',
                'model' => 'd4PDF HPB',
                'ensemble_members' => $config['ensemble_members'],
                'ensemble_range' => '1-' . $config['ensemble_members']
            ],
            'nat' => [
                'description' => 'Natural Climate (No Anthropogenic Warming)',
                'period' => $config['time_period'],
                'warming' => 'Natural Only',
                'model' => 'd4PDF HPB NAT',
                'ensemble_members' => $config['ensemble_members'],
                'ensemble_range' => '1-' . $config['ensemble_members']
            ],
            '2k' => [
                'description' => '+2K Global Warming Scenario',
                'period' => $config['time_period'],
                'warming' => '+2K',
                'model' => 'd4PDF HFB_2K',
                'ensemble_members' => $config['ensemble_members'],
                'ensemble_range' => '101-109',
                'sst_models' => $config['sst_models'] ?? []
            ],
            '4k' => [
                'description' => '+4K Global Warming Scenario',
                'period' => $config['time_period'],
                'warming' => '+4K',
                'model' => 'd4PDF HFB_4K',
                'ensemble_members' => $config['ensemble_members'],
                'ensemble_range' => '101-115',
                'sst_models' => $config['sst_models'] ?? []
            ]
        ];
        
        return $metadata[$scenario] ?? [];
    }
    
    private function getAvailableEnsembles($scenario) {
        $ensembles = $this->parser->getAvailableEnsembles($scenario);
        $this->sendSuccess([
            'scenario' => $scenario,
            'ensembles' => $ensembles
        ]);
    }
    
    private function processJsonData($jsonData, $scenario) {
        $cyclones = [];
        
        if (isset($jsonData['ensemble_data'][0]['cyclones'])) {
            foreach ($jsonData['ensemble_data'][0]['cyclones'] as $cyclone) {
                $cyclones[] = [
                    'id' => $cyclone['id'],
                    'name' => $cyclone['name'],
                    'year' => $cyclone['year'],
                    'maxCategory' => $cyclone['max_category'],
                    'maxWind' => round($cyclone['max_wind_speed'] * 1.852),
                    'minPressure' => $cyclone['min_pressure'],
                    'duration' => round($cyclone['duration_hours'] / 24),
                    'landfall' => $cyclone['landfall'],
                    'track' => array_map(function($point) {
                        return [
                            'lat' => $point['lat'],
                            'lon' => $point['lon'],
                            'date' => $point['datetime'],
                            'category' => $point['category'],
                            'windSpeed' => round($point['wind_speed_kt'] * 1.852),
                            'pressure' => $point['pressure_hpa']
                        ];
                    }, $cyclone['track'])
                ];
            }
        }
        
        return [
            'scenario' => $scenario,
            'metadata' => $jsonData['metadata'],
            'cyclones' => $cyclones
        ];
    }
    
    private function generateSimulatedCyclones($scenario) {
        $scenarioFactors = [
            'current' => ['count' => 15, 'intensity' => 1.0],
            'nat' => ['count' => 12, 'intensity' => 0.9],
            '2k' => ['count' => 18, 'intensity' => 1.2],
            '4k' => ['count' => 22, 'intensity' => 1.5]
        ];
        
        $factor = $scenarioFactors[$scenario];
        $cyclones = [];
        
        for ($i = 0; $i < $factor['count']; $i++) {
            $cyclone = $this->generateCyclone($i, $factor['intensity']);
            $cyclones[] = $cyclone;
        }
        
        return $cyclones;
    }
    
    private function generateCyclone($index, $intensityFactor) {
        $names = ['Anika', 'Billy', 'Charlotte', 'Dylan', 'Esther', 
                  'Freddy', 'Gabrielle', 'Herman', 'Ilsa', 'Jasper',
                  'Kirrily', 'Lincoln', 'Megan', 'Neville', 'Olga',
                  'Paul', 'Quincey', 'Ruby', 'Sean', 'Tanya'];
        
        $year = 2020 + ($index % 10);
        $name = $names[$index % count($names)];
        
        $startRegions = [
            ['lat' => -10 + rand(-2, 2), 'lon' => 130 + rand(-5, 5)],
            ['lat' => -15 + rand(-2, 2), 'lon' => 145 + rand(-5, 5)], 
            ['lat' => -20 + rand(-2, 2), 'lon' => 115 + rand(-5, 5)]
        ];
        
        $start = $startRegions[array_rand($startRegions)];
        $track = $this->generateTrack($start, $intensityFactor);
        
        $categories = array_column($track, 'category');
        $maxCategory = max($categories);
        
        return [
            'id' => 'TC_' . $year . '_' . str_pad($index, 3, '0', STR_PAD_LEFT),
            'name' => $name,
            'year' => $year,
            'maxCategory' => $maxCategory,
            'maxWind' => 50 + ($maxCategory * 30) + rand(-10, 10),
            'minPressure' => 990 - ($maxCategory * 15) + rand(-5, 5),
            'duration' => count($track),
            'landfall' => $this->checkLandfall($track),
            'track' => $track
        ];
    }
    
    private function generateTrack($start, $intensityFactor) {
        $track = [];
        $lat = $start['lat'];
        $lon = $start['lon'];
        $days = rand(5, 15);
        
        $category = min(5, max(1, round(rand(1, 3) * $intensityFactor)));
        
        for ($day = 0; $day < $days; $day++) {
            $lat += rand(-10, 5) / 10;
            $lon += rand(-5, 10) / 10;
            
            if ($day < $days / 2) {
                $category = min(5, $category + (rand(0, 100) > 70 ? 1 : 0));
            } else {
                $category = max(1, $category - (rand(0, 100) > 60 ? 1 : 0));
            }
            
            $track[] = [
                'lat' => round($lat, 2),
                'lon' => round($lon, 2),
                'date' => date('Y-m-d', strtotime("+$day days", strtotime("2020-01-01"))),
                'category' => $category,
                'windSpeed' => 50 + ($category * 30) + rand(-10, 10),
                'pressure' => 990 - ($category * 15) + rand(-5, 5)
            ];
        }
        
        return $track;
    }
    
    private function checkLandfall($track) {
        foreach ($track as $point) {
            if ($point['lat'] > -39 && $point['lat'] < -10 &&
                $point['lon'] > 113 && $point['lon'] < 154) {
                return true;
            }
        }
        return false;
    }
    
    private function getScenarioMetadata($scenario) {
        $metadata = $this->getMetadata($scenario);
        $this->sendSuccess($metadata);
    }
    
    private function sendSuccess($data) {
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }
    
    private function sendError($message) {
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
    
    private function processDp4dfData($filename, $scenario) {
        return [];
    }
}

try {
    $api = new CycloneDataAPI();
    $api->handleRequest();
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>