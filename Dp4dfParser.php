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
        
        // Check cache first
        $cacheFile = $this->cacheDir . $filename . '.json';
        if (ENABLE_CACHING && file_exists($cacheFile) && 
            (time() - filemtime($cacheFile) < $this->cacheLifetime)) {
            return json_decode(file_get_contents($cacheFile), true);
        }
        
        // Fetch and parse data
        $rawData = $this->fetchData($url);
        if (!$rawData) {
            return null;
        }
        
        $cyclones = $this->parseTrackData($rawData, $scenario);
        
        // Cache the parsed data
        if (ENABLE_CACHING) {
            file_put_contents($cacheFile, json_encode($cyclones));
        }
        
        return $cyclones;
    }
    
    /**
     * Build filename based on scenario and parameters
     */
    private function buildFilename($scenario, $ensembleId, $sstModel = null) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        
        switch ($scenario) {
            case 'current':
                // Format: xytrackk319b_HPB_m001_1951-2011.txt
                return sprintf('%sm%03d%s', 
                    $config['prefix'], 
                    $ensembleId, 
                    $config['suffix']
                );
                
            case '2k':
            case '4k':
                // Format: xytrackk319b_HFB_2K_CC_m001_2051-2111.txt
                if (!$sstModel) {
                    $sstModel = $config['sst_models'][0]; // Default to first model
                }
                return sprintf('%s%s_m%03d%s', 
                    $config['prefix'], 
                    $sstModel,
                    $ensembleId, 
                    $config['suffix']
                );
        }
    }
    
    /**
     * Fetch data from URL
     */
    private function fetchData($url) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
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