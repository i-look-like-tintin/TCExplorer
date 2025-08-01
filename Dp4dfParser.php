<?php


class Dp4dfParser {
    private $baseUrl;
    private $cacheDir;
    private $cacheLifetime;
    
    public function __construct() {
        $this->baseUrl = DP4DF_BASE_URL;
        $this->cacheDir = CACHE_PATH . 'dp4df/';
        $this->cacheLifetime = CACHE_LIFETIME;
        
        if (!file_exists($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    

    public function getCycloneData($scenario, $ensembleId = 1, $sstModel = null) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        $filename = $this->buildFilename($scenario, $ensembleId, $sstModel);
        $url = $this->baseUrl . $filename;
        
        error_log("=== Dp4dfParser::getCycloneData ===");
        error_log("Scenario: $scenario, Ensemble: $ensembleId, SST: " . ($sstModel ?? 'default'));
        error_log("Attempting to fetch d4PDF data from: $url");
        
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
        
        $rawData = $this->fetchData($url);
        if (!$rawData) {
            error_log("Failed to fetch data from URL: $url");
            return null;
        }
        
        error_log("Successfully fetched " . strlen($rawData) . " bytes of data");
        
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
        
        $cyclones = $this->applyDataReduction($cyclones);
        
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


    private function applyDataReduction($cyclones) {
        $minCategory = defined('MIN_CATEGORY_FILTER') ? MIN_CATEGORY_FILTER : 1;
        $maxTrackPoints = defined('MAX_TRACK_POINTS') ? MAX_TRACK_POINTS : 20;
        
        $filtered = [];
        foreach ($cyclones as $cyclone) {
            if ($cyclone['maxCategory'] >= $minCategory) {
                $cyclone['track'] = $this->simplifyTrack($cyclone['track'], $maxTrackPoints);
                $filtered[] = $cyclone;
            }
        }
        
        error_log("Reduced from " . count($cyclones) . " to " . count($filtered) . " cyclones after filtering (min category: $minCategory)");
        
        return $filtered;
    }
    

    //TODO honestly, not needed
    private function simplifyTrack($track, $maxPoints = 20) {
        if (count($track) <= $maxPoints) {
            return $track; 
        }
        
        $simplified = [];
        $interval = ceil(count($track) / $maxPoints);
        
        for ($i = 0; $i < count($track); $i += $interval) {
            $simplified[] = $track[$i];
        }
        
        if ($simplified[count($simplified) - 1] !== $track[count($track) - 1]) {
            $simplified[] = $track[count($track) - 1];
        }
        
        return $simplified;
    }
    

    private function buildFilename($scenario, $ensembleId, $sstModel = null) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        
        switch ($scenario) {
            case 'current':
                $actualEnsemble = $ensembleId; 
                return sprintf('%s%03d%s', 
                    $config['prefix'], 
                    $actualEnsemble, 
                    $config['suffix']
                );
            //TODO: 2k and 4k cases here are bodge fixes
            //I used the purely human ability to hit shit with hammers until it started working lol
            case '2k':
                $ensembleStart = 101;
                $actualEnsemble = $ensembleStart + $ensembleId - 1;
                $yearRange = "_2031-2090.txt";

                if (!$sstModel) {
                    $sstModel = $config['sst_models'][0];
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
                // Again, kind of a bodge fix, but she works.                
                $ensembleStart = 101;
                $actualEnsemble = $ensembleStart + $ensembleId - 1;
                $yearRange = "_2051-2110.txt";

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


    private function fetchData($url) {
        $headers = @get_headers($url, 1);
        $fileSize = isset($headers['Content-Length']) ? (int)$headers['Content-Length'] : 0;
        
        if ($fileSize > 0) {
            $sizeMB = round($fileSize / 1024 / 1024, 2);
            error_log("File size: {$sizeMB} MB");
            
            // Shouldn't occur with this dataset, but hey its here if needed in future
            if ($fileSize > 50 * 1024 * 1024) {
                error_log("Large file detected, this may take a while...");
            }
        }
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 60, 
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
    
    private function parseTrackData($rawData, $scenario) {
        $lines = explode("\n", trim($rawData));
        $cyclones = [];
        $currentCyclone = null;
        $currentId = null;
        
        $yearMin = isset($_GET['year_min']) ? (int)$_GET['year_min'] : null;
        $yearMax = isset($_GET['year_max']) ? (int)$_GET['year_max'] : null;
        
        foreach ($lines as $line) {
            if (empty($line) || $line[0] === '#') {
                continue;
            }
            
            $data = $this->parseLine($line);
            if (!$data) {
                continue;
            }
            
            if ($yearMin && $data['year'] < $yearMin) continue;
            if ($yearMax && $data['year'] > $yearMax) continue;
            
            if ($data['tc_id'] !== $currentId) {
                if ($currentCyclone) {
                    $this->finalizeCyclone($currentCyclone);
                    $cyclones[] = $currentCyclone;
                }
                
                $currentId = $data['tc_id'];
                $currentCyclone = $this->initializeCyclone($data, $scenario);
            }
            
            $currentCyclone['track'][] = $this->createTrackPoint($data);
            $this->updateCycloneStats($currentCyclone, $data);
        }

        if ($currentCyclone) {
            $this->finalizeCyclone($currentCyclone);
            $cyclones[] = $currentCyclone;
        }
        
        error_log("Parsed " . count($cyclones) . " cyclones from raw data");
        
        return $cyclones;
    }
    

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
    

    private function createTrackPoint($data) {
        $datetime = sprintf('%04d-%02d-%02d %02d:00:00', 
            $data['year'], $data['month'], $data['day'], $data['hour']);
        
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
    

    private function updateCycloneStats(&$cyclone, $data) {
        if ($data['wind_surface'] > $cyclone['max_wind_mps']) {
            $cyclone['max_wind_mps'] = $data['wind_surface'];
        }
        
        if ($data['pressure'] < $cyclone['min_pressure']) {
            $cyclone['min_pressure'] = $data['pressure'];
        }
        
        $datetime = sprintf('%04d-%02d-%02d %02d:00:00', 
            $data['year'], $data['month'], $data['day'], $data['hour']);
        $cyclone['end_date'] = $datetime;
        
        if ($this->isOverAustralia($data['latitude'], $data['longitude'])) {
            $cyclone['landfall'] = true;
        }
    }
    

    private function finalizeCyclone(&$cyclone) {
        $start = strtotime($cyclone['start_date']);
        $end = strtotime($cyclone['end_date']);
        $cyclone['duration_hours'] = ($end - $start) / 3600;
        $cyclone['duration_days'] = round($cyclone['duration_hours'] / 24, 1);
        
        $cyclone['maxWind'] = round($cyclone['max_wind_mps'] * 3.6, 1);
        $cyclone['maxCategory'] = $this->windToCategory($cyclone['maxWind']);
        
        $cyclone['minPressure'] = round($cyclone['min_pressure'], 1);
        
        $cyclone['name'] = $this->generateCycloneName($cyclone['year'], $cyclone['original_id']);
        
        unset($cyclone['max_wind_mps']);
        unset($cyclone['min_pressure']);
    }
    

    private function windToCategory($windKmh) {
        if ($windKmh < 63) return 0;      // Below tropical cyclone
        if ($windKmh < 89) return 1;      // Category 1
        if ($windKmh < 118) return 2;     // Category 2
        if ($windKmh < 159) return 3;     // Category 3
        if ($windKmh < 200) return 4;     // Category 4
        return 5;                          // Category 5
    }
    

    private function isOverAustralia($lat, $lon) {
        // Simplified bounding box check
        return ($lat > -39 && $lat < -10 && $lon > 113 && $lon < 154);
    }
    
    //TODO: this is, i think, not quite correct as altho they are named on a rotating list, we should probably compute what the starting names for each set should be to go from there
    //on second thoughts, this is probably only necessary for historical data because, yknow, the future and all is wibbly wobbly
    //but still tho, could be worth doing for the past

    //o and also the list is not fully complete iaw bom fair sure

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
