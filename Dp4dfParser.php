<?php
/**
 * d4PDF Tropical Cyclone Track Data Parser
 * 
 * Parses track data from d4PDF text files according to the format:
 * AAAA BBBBB CCCC DD EE FF GGGGGG HHHHHH IIIII JJJJJ KKKKKK LLLLL MMMM NNNNNN OOOO PP
 */

class Dp4dfParser {
    private $baseUrl;
    private $cacheDir;
    private $cacheLifetime;
    
    public function __construct() {
        $this->baseUrl = DP4DF_BASE_URL;
        $this->cacheDir = CACHE_PATH . 'dp4df/';
        $this->cacheLifetime = CACHE_LIFETIME;
        
        // Create cache directory if it doesn't exist
        if (!file_exists($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    /**
     * Get cyclone data for a specific scenario
     */
    public function getCycloneData($scenario, $ensembleId = 1, $sstModel = null) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        $filename = $this->buildFilename($scenario, $ensembleId, $sstModel);
        $url = $this->baseUrl . $filename;
        
        error_log("=== Dp4dfParser::getCycloneData ===");
        error_log("Scenario: $scenario, Ensemble: $ensembleId, SST: " . ($sstModel ?? 'default'));
        error_log("Attempting to fetch d4PDF data from: $url");
        
        // Check cache first
        $cacheFile = $this->cacheDir . $filename . '.json';
        if (ENABLE_CACHING && file_exists($cacheFile) && 
            (time() - filemtime($cacheFile) < $this->cacheLifetime)) {
            error_log("Using cached data from: $cacheFile");
            $cachedData = json_decode(file_get_contents($cacheFile), true);
            if ($cachedData !== null) {
                return $cachedData;
            }
            error_log("Cache file exists but failed to decode, fetching fresh data");
        }
        
        // Fetch and parse data
        $rawData = $this->fetchData($url);
        if (!$rawData) {
            error_log("Failed to fetch data from URL: $url");
            return null;
        }
        
        error_log("Successfully fetched " . strlen($rawData) . " bytes of data");
        
        // Check if we got HTML error page instead of data
        if (strpos($rawData, '<html') !== false || strpos($rawData, '<!DOCTYPE') !== false) {
            error_log("Received HTML instead of data - likely 404 or error page");
            return null;
        }
        
        $cyclones = $this->parseTrackData($rawData, $scenario);
        
        if (empty($cyclones)) {
            error_log("No cyclones parsed from data");
            return null;
        }
        
        error_log("Parsed " . count($cyclones) . " cyclones from data");
        
        // Apply additional filters to reduce data volume
        $cyclones = $this->applyDataReduction($cyclones);
        
        // Cache the parsed data
        if (ENABLE_CACHING && !empty($cyclones)) {
            $cacheResult = file_put_contents($cacheFile, json_encode($cyclones));
            if ($cacheResult !== false) {
                error_log("Cached parsed data to: $cacheFile");
            } else {
                error_log("Failed to write cache file: $cacheFile");
            }
        }
        
        return $cyclones;
    }

    /**
     * Apply data reduction strategies
     */
    private function applyDataReduction($cyclones) {
        // Get filter settings
        $minCategory = defined('MIN_CATEGORY_FILTER') ? MIN_CATEGORY_FILTER : 1;
        $maxTrackPoints = defined('MAX_TRACK_POINTS') ? MAX_TRACK_POINTS : 20;
        
        // Filter out weak systems (below tropical cyclone strength)
        $filtered = [];
        foreach ($cyclones as $cyclone) {
            // Only include if it reached at least the minimum category
            if ($cyclone['maxCategory'] >= $minCategory) {
                // Simplify track to reduce data volume
                $cyclone['track'] = $this->simplifyTrack($cyclone['track'], $maxTrackPoints);
                $filtered[] = $cyclone;
            }
        }
        
        error_log("Reduced from " . count($cyclones) . " to " . count($filtered) . " cyclones after filtering (min category: $minCategory)");
        
        return $filtered;
    }
    
    /**
     * Simplify track by reducing points
     */
    private function simplifyTrack($track, $maxPoints = 20) {
        if (count($track) <= $maxPoints) {
            return $track; // Already simple enough
        }
        
        // Keep every nth point to reduce data volume
        $simplified = [];
        $interval = ceil(count($track) / $maxPoints);
        
        for ($i = 0; $i < count($track); $i += $interval) {
            $simplified[] = $track[$i];
        }
        
        // Always include the last point
        if ($simplified[count($simplified) - 1] !== $track[count($track) - 1]) {
            $simplified[] = $track[count($track) - 1];
        }
        
        return $simplified;
    }
    
    /**
     * Build filename based on scenario and parameters
     */
    private function buildFilename($scenario, $ensembleId, $sstModel = null) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        
        switch ($scenario) {
            case 'current':
                // Format: xytrackk319b_HPB_m001_1951-2011.txt
                $actualEnsemble = $ensembleId; // No offset for current
                return sprintf('%s%03d%s', 
                    $config['prefix'], 
                    $actualEnsemble, 
                    $config['suffix']
                );
            //TODO: 2k and 4k cases here are bodge fixes cos AI cracked the shits
            //so I used the purely human ability to hit shit with hammers until it started working lol
            case '2k':
                                // Convert display ensemble (1-9 or 1-15) to actual ensemble number (101-109 or 101-115)
                //$ensembleStart = isset($config['ensemble_start']) ? $config['ensemble_start'] : 1;
                $ensembleStart = 101;
                $actualEnsemble = $ensembleStart + $ensembleId - 1;
                $yearRange = "_2031-2090.txt";
                // Format: xytrackk319b_HFB_2K_CC_m101_2031-2090.txt
                // SST model comes BEFORE ensemble number
                if (!$sstModel) {
                    $sstModel = $config['sst_models'][0]; // Default to CC
                }
                
                $filename = sprintf('%s%s_m%03d%s', 
                    $config['prefix'],    // e.g., "xytrackk319b_HFB_2K_"
                    $sstModel,            // e.g., "CC"
                    $actualEnsemble,      // e.g., "101"
                    $yearRange    // e.g., "_2031-2090.txt"
                );
                
                error_log("Built filename for {$scenario}: {$filename} (display ensemble: {$ensembleId}, actual: {$actualEnsemble})");
                return $filename;
            case '4k':
                // Convert display ensemble (1-9 or 1-15) to actual ensemble number (101-109 or 101-115)
                //$ensembleStart = isset($config['ensemble_start']) ? $config['ensemble_start'] : 1;
                $ensembleStart = 101;
                $actualEnsemble = $ensembleStart + $ensembleId - 1;
                $yearRange = "_2051-2110.txt";
                // Format: xytrackk319b_HFB_2K_CC_m101_2031-2090.txt
                // SST model comes BEFORE ensemble number
                if (!$sstModel) {
                    $sstModel = $config['sst_models'][0]; // Default to CC
                }
                
                $filename = sprintf('%s%s_m%03d%s', 
                    $config['prefix'],    // e.g., "xytrackk319b_HFB_2K_"
                    $sstModel,            // e.g., "CC"
                    $actualEnsemble,      // e.g., "101"
                    $yearRange    // e.g., "_2031-2090.txt"
                );
                
                error_log("Built filename for {$scenario}: {$filename} (display ensemble: {$ensembleId}, actual: {$actualEnsemble})");
                return $filename;
                
        }
        
        return '';
    }

    /**
     * Fetch data from URL
     */
    private function fetchData($url) {
        // First try to get file size
        $headers = @get_headers($url, 1);
        $fileSize = isset($headers['Content-Length']) ? (int)$headers['Content-Length'] : 0;
        
        if ($fileSize > 0) {
            $sizeMB = round($fileSize / 1024 / 1024, 2);
            error_log("File size: {$sizeMB} MB");
            
            // If file is very large, consider partial fetch
            if ($fileSize > 50 * 1024 * 1024) { // 50MB
                error_log("Large file detected, this may take a while...");
            }
        }
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 60, // Increase timeout for large files
                'user_agent' => 'TC-Visualization/1.0'
            ]
        ]);
        
        $data = @file_get_contents($url, false, $context);
        if ($data === false) {
            error_log("Failed to fetch data from: $url");
            return null;
        }
        
        return $data;
    }
    
    /**
     * Parse track data from d4PDF format
     */
    private function parseTrackData($rawData, $scenario) {
        $lines = explode("\n", trim($rawData));
        $cyclones = [];
        $currentCyclone = null;
        $currentId = null;
        
        // Get year range filter from config or default
        $yearMin = isset($_GET['year_min']) ? (int)$_GET['year_min'] : null;
        $yearMax = isset($_GET['year_max']) ? (int)$_GET['year_max'] : null;
        
        foreach ($lines as $line) {
            // Skip empty lines and comments
            if (empty($line) || $line[0] === '#') {
                continue;
            }
            
            // Parse line according to format
            $data = $this->parseLine($line);
            if (!$data) {
                continue;
            }
            
            // Apply year filter if specified
            if ($yearMin && $data['year'] < $yearMin) continue;
            if ($yearMax && $data['year'] > $yearMax) continue;
            
            // Check if this is a new cyclone
            if ($data['tc_id'] !== $currentId) {
                // Save previous cyclone if exists
                if ($currentCyclone) {
                    $this->finalizeCyclone($currentCyclone);
                    $cyclones[] = $currentCyclone;
                }
                
                // Start new cyclone
                $currentId = $data['tc_id'];
                $currentCyclone = $this->initializeCyclone($data, $scenario);
            }
            
            // Add track point
            $currentCyclone['track'][] = $this->createTrackPoint($data);
            
            // Update cyclone statistics
            $this->updateCycloneStats($currentCyclone, $data);
        }
        
        // Don't forget the last cyclone
        if ($currentCyclone) {
            $this->finalizeCyclone($currentCyclone);
            $cyclones[] = $currentCyclone;
        }
        
        error_log("Parsed " . count($cyclones) . " cyclones from raw data");
        
        return $cyclones;
    }
    
    /**
     * Parse a single line of track data
     */
    private function parseLine($line) {
        // Format: AAAA BBBBB CCCC DD EE FF GGGGGG HHHHHH IIIII JJJJJ KKKKKK LLLLL MMMM NNNNNN OOOO PP
        $pattern = '/^\s*(\d+)\s+(\d+)\s+(\d{4})\s+(\d+)\s+(\d+)\s+(\d+)\s+' .
                   '([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+' .
                   '([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+(\d+)/';
        
        if (!preg_match($pattern, $line, $matches)) {
            return null;
        }
        
        return [
            'tc_id' => (int)$matches[1],
            'step_id' => (int)$matches[2],
            'year' => (int)$matches[3],
            'month' => (int)$matches[4],
            'day' => (int)$matches[5],
            'hour' => (int)$matches[6],
            'longitude' => (float)$matches[7],
            'latitude' => (float)$matches[8],
            'wind_850hpa' => (float)$matches[9],
            'wind_surface' => (float)$matches[10],
            'pressure' => (float)$matches[11],
            'pressure_diff' => (float)$matches[12],
            'temp_anomaly' => (float)$matches[13],
            'wind_shear' => (float)$matches[14],
            'unused' => (float)$matches[15],
            'genesis_month' => (int)$matches[16]
        ];
    }
    
    /**
     * Initialize a new cyclone structure
     */
    private function initializeCyclone($data, $scenario) {
        $datetime = sprintf('%04d-%02d-%02d %02d:00:00', 
            $data['year'], $data['month'], $data['day'], $data['hour']);
        
        return [
            'id' => sprintf('TC_%04d_%04d_%s', $data['year'], $data['tc_id'], $scenario),
            'original_id' => $data['tc_id'],
            'year' => $data['year'],
            'genesis_month' => $data['genesis_month'],
            'genesis_lat' => $data['latitude'],
            'genesis_lon' => $data['longitude'],
            'start_date' => $datetime,
            'end_date' => $datetime,
            'max_wind_mps' => $data['wind_surface'],
            'min_pressure' => $data['pressure'],
            'track' => [],
            'duration_hours' => 0,
            'landfall' => false
        ];
    }
    
    /**
     * Create a track point
     */
    private function createTrackPoint($data) {
        $datetime = sprintf('%04d-%02d-%02d %02d:00:00', 
            $data['year'], $data['month'], $data['day'], $data['hour']);
        
        // Convert wind speed from m/s to km/h and estimate category
        $windKmh = $data['wind_surface'] * 3.6;
        $category = $this->windToCategory($windKmh);
        
        return [
            'lat' => round($data['latitude'], 3),
            'lon' => round($data['longitude'], 3),
            'date' => $datetime,
            'category' => $category,
            'windSpeed' => round($windKmh, 1),
            'pressure' => round($data['pressure'], 1),
            'wind850hpa' => round($data['wind_850hpa'], 1),
            'pressureDiff' => round($data['pressure_diff'], 1)
        ];
    }
    
    /**
     * Update cyclone statistics with new track point
     */
    private function updateCycloneStats(&$cyclone, $data) {
        // Update maximum wind speed
        if ($data['wind_surface'] > $cyclone['max_wind_mps']) {
            $cyclone['max_wind_mps'] = $data['wind_surface'];
        }
        
        // Update minimum pressure
        if ($data['pressure'] < $cyclone['min_pressure']) {
            $cyclone['min_pressure'] = $data['pressure'];
        }
        
        // Update end date
        $datetime = sprintf('%04d-%02d-%02d %02d:00:00', 
            $data['year'], $data['month'], $data['day'], $data['hour']);
        $cyclone['end_date'] = $datetime;
        
        // Check landfall (simplified - checks if over Australian mainland)
        if ($this->isOverAustralia($data['latitude'], $data['longitude'])) {
            $cyclone['landfall'] = true;
        }
    }
    
    /**
     * Finalize cyclone data
     */
    private function finalizeCyclone(&$cyclone) {
        // Calculate duration
        $start = strtotime($cyclone['start_date']);
        $end = strtotime($cyclone['end_date']);
        $cyclone['duration_hours'] = ($end - $start) / 3600;
        $cyclone['duration_days'] = round($cyclone['duration_hours'] / 24, 1);
        
        // Convert max wind to km/h
        $cyclone['maxWind'] = round($cyclone['max_wind_mps'] * 3.6, 1);
        $cyclone['maxCategory'] = $this->windToCategory($cyclone['maxWind']);
        
        // Round pressure
        $cyclone['minPressure'] = round($cyclone['min_pressure'], 1);
        
        // Generate a name (using year and ID for uniqueness)
        $cyclone['name'] = $this->generateCycloneName($cyclone['year'], $cyclone['original_id']);
        
        // Clean up temporary fields
        unset($cyclone['max_wind_mps']);
        unset($cyclone['min_pressure']);
    }
    
    /**
     * Convert wind speed (km/h) to category (Australian scale)
     */
    private function windToCategory($windKmh) {
        if ($windKmh < 63) return 0;      // Below tropical cyclone
        if ($windKmh < 89) return 1;      // Category 1
        if ($windKmh < 118) return 2;     // Category 2
        if ($windKmh < 159) return 3;     // Category 3
        if ($windKmh < 200) return 4;     // Category 4
        return 5;                          // Category 5
    }
    
    /**
     * Check if coordinates are over Australian mainland
     */
    private function isOverAustralia($lat, $lon) {
        // Simplified bounding box check
        return ($lat > -39 && $lat < -10 && $lon > 113 && $lon < 154);
    }
    
    /**
     * Generate a cyclone name based on year and ID
     */
    private function generateCycloneName($year, $id) {
        // Australian cyclone names (rotating list)
        $names = [
            'Anika', 'Billy', 'Charlotte', 'Dylan', 'Esther', 
            'Freddy', 'Gabrielle', 'Herman', 'Ilsa', 'Jasper',
            'Kirrily', 'Lincoln', 'Megan', 'Neville', 'Olga',
            'Paul', 'Robyn', 'Stan', 'Tatiana', 'Wallace'
        ];
        
        // Use year and ID to select a name
        $index = ($year + $id) % count($names);
        return $names[$index];
    }
    
    /**
     * Get available ensemble members for a scenario
     */
    public function getAvailableEnsembles($scenario) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        $available = [];
        
        // For prototype, just return first few ensemble members
        $maxCheck = min(5, $config['ensemble_members']);
        
        for ($i = 1; $i <= $maxCheck; $i++) {
            $filename = $this->buildFilename($scenario, $i);
            $available[] = [
                'id' => $i,
                'filename' => $filename,
                'cached' => file_exists($this->cacheDir . $filename . '.json')
            ];
        }
        
        return $available;
    }
}
?>