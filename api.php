<?php
/**
 * Tropical Cyclone Visualization API
 * 
 * This API serves cyclone track data from d4PDF dataset
 */

// Enable error logging (but not display)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';
require_once 'Dp4dfParser.php';

// Set CORS headers based on configuration
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Content-Type: application/json');

class CycloneDataAPI {
    private $dataPath;
    private $scenarios = ['current', '2k', '4k'];
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
        
        if (!in_array($scenario, $this->scenarios)) {
            $this->sendError('Invalid scenario');
            return;
        }
        
        switch ($action) {
            case 'getCycloneData':
                $this->getCycloneData($scenario);
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
        
        // For 2K/4K scenarios, default to CC model if not specified
        if (($scenario === '2k' || $scenario === '4k') && !$sstModel) {
            $sstModel = 'CC';
        }
        
        // Add debug mode
        $debug = isset($_GET['debug']) && $_GET['debug'] === 'true';
        
        // Add option to force use of sample data for testing
        $useSample = isset($_GET['use_sample']) && $_GET['use_sample'] === 'true';
        
        if (!$useSample) {
            // Check if parser is available
            if ($this->parser === null) {
                error_log("API: Parser is null, cannot fetch d4PDF data");
            } else {
                // Try to get data from d4PDF
                if ($debug) {
                    error_log("API: Attempting to fetch d4PDF data for scenario: $scenario, ensemble: $ensembleId, SST: " . ($sstModel ?? 'none'));
                }
                
                $cyclones = $this->parser->getCycloneData($scenario, $ensembleId, $sstModel);
                
                if ($cyclones !== null) {
                    if ($debug) {
                        error_log("API: Successfully got " . count($cyclones) . " cyclones from d4PDF");
                    }
                    
                    // Filter cyclones to Australian region if requested
                    if (isset($_GET['filter']) && $_GET['filter'] === 'australia') {
                        $beforeFilter = count($cyclones);
                        $cyclones = $this->filterToAustralianRegion($cyclones);
                        if ($debug) {
                            error_log("API: Filtered from $beforeFilter to " . count($cyclones) . " cyclones (Australian region)");
                        }
                    }
                    
                    $metadata = $this->getMetadata($scenario);
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
        
        // Fall back to sample data if d4PDF fails or sample is requested
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
    
    private function filterToAustralianRegion($cyclones) {
        $filtered = [];
        
        foreach ($cyclones as $cyclone) {
            // Check if any track point is within Australian region bounds
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
        
        // Process ensemble data - for demo, just use first ensemble
        if (isset($jsonData['ensemble_data'][0]['cyclones'])) {
            foreach ($jsonData['ensemble_data'][0]['cyclones'] as $cyclone) {
                $cyclones[] = [
                    'id' => $cyclone['id'],
                    'name' => $cyclone['name'],
                    'year' => $cyclone['year'],
                    'maxCategory' => $cyclone['max_category'],
                    'maxWind' => round($cyclone['max_wind_speed'] * 1.852), // Convert knots to km/h
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
        // Simulate different numbers and intensities based on scenario
        $scenarioFactors = [
            'current' => ['count' => 15, 'intensity' => 1.0],
            '2k' => ['count' => 18, 'intensity' => 1.2],
            '4k' => ['count' => 22, 'intensity' => 1.5]
        ];
        
        $factor = $scenarioFactors[$scenario];
        $cyclones = [];
        
        // Generate cyclones for Australian region
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
        
        // Generate track starting from different regions around Australia
        $startRegions = [
            ['lat' => -10 + rand(-2, 2), 'lon' => 130 + rand(-5, 5)], // North
            ['lat' => -15 + rand(-2, 2), 'lon' => 145 + rand(-5, 5)], // Northeast
            ['lat' => -20 + rand(-2, 2), 'lon' => 115 + rand(-5, 5)]  // Northwest
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
        
        // Initial category based on intensity factor
        $category = min(5, max(1, round(rand(1, 3) * $intensityFactor)));
        
        for ($day = 0; $day < $days; $day++) {
            // General movement pattern - tends southwest
            $lat += rand(-10, 5) / 10;
            $lon += rand(-5, 10) / 10;
            
            // Intensity evolution
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
        // Simplified landfall check - if track crosses Australian mainland
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
    
    /**
     * Process actual dp4df NetCDF data
     * TODO: Implement when data is available
     */
    private function processDp4dfData($filename, $scenario) {
        // This function would:
        // 1. Read NetCDF file using PHP-NetCDF extension or exec() with ncdump
        // 2. Extract cyclone tracks
        // 3. Process ensemble members
        // 4. Filter by region (Australian domain)
        // 5. Calculate statistics
        // 6. Return formatted data
        
        // Placeholder for actual implementation
        return [];
    }
}

// Initialize and handle request
try {
    $api = new CycloneDataAPI();
    $api->handleRequest();
} catch (Exception $e) {
    // If there's a fatal error, return it as JSON
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>