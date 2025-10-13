<?php

/**
 * IBTraCS Parser
 *
 * Fetches and parses International Best Track Archive for Climate Stewardship (IBTrACS) data
 * IBTrACS includes data from multiple agencies including BoM (Bureau of Meteorology, Australia)
 *
 * Data Source: NOAA National Centers for Environmental Information (NCEI)
 * URL: https://www.ncei.noaa.gov/products/international-best-track-archive
 */

class IBTraCSParser {
    private $cacheDir;
    private $cacheExpiry = 604800; // 7 days in seconds
    private $lastError = null;

    // IBTrACS data URLs
    private $ibtracsUrls = [
        'all' => 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.ALL.list.v04r01.csv',
        'sp' => 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.SP.list.v04r01.csv',
        'si' => 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.SI.list.v04r01.csv'
    ];

    // Regional bounds definitions
    private $regions = [
        'australian' => [
            'name' => 'Australian Region',
            'north' => -5,
            'south' => -45,
            'east' => 160,
            'west' => 105
        ],
        'global' => [
            'name' => 'Global (All Regions)',
            'north' => 90,
            'south' => -90,
            'east' => 180,
            'west' => -180
        ],
        'north_atlantic' => [
            'name' => 'North Atlantic',
            'north' => 60,
            'south' => 0,
            'east' => 0,
            'west' => -100
        ],
        'western_pacific' => [
            'name' => 'Western Pacific',
            'north' => 60,
            'south' => 0,
            'east' => 180,
            'west' => 100
        ],
        'eastern_pacific' => [
            'name' => 'Eastern Pacific',
            'north' => 60,
            'south' => 0,
            'east' => -75,
            'west' => -180
        ],
        'north_indian' => [
            'name' => 'North Indian',
            'north' => 40,
            'south' => 0,
            'east' => 100,
            'west' => 30
        ],
        'south_indian' => [
            'name' => 'South Indian',
            'north' => 0,
            'south' => -40,
            'east' => 115,
            'west' => 20
        ],
        'south_pacific' => [
            'name' => 'South Pacific',
            'north' => 0,
            'south' => -40,
            'east' => -120,
            'west' => 135
        ]
    ];

    public function __construct($cacheDir = null) {
        // If a cache directory is provided, append 'ibtracs/' subdirectory
        if ($cacheDir !== null) {
            // Ensure trailing slash
            $cacheDir = rtrim($cacheDir, '/') . '/';
            $this->cacheDir = $cacheDir . 'ibtracs/';
        } else {
            $this->cacheDir = __DIR__ . '/../cache/ibtracs/';
        }

        // Create cache directory if it doesn't exist
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0777, true);
            @chmod($this->cacheDir, 0777); // Ensure write permissions
        }
    }

    /**
     * Get cyclone data for a specified region from IBTrACS
     *
     * @param string $basin Basin identifier ('all', 'sp', 'si')
     * @param string $region Region identifier ('australian', 'global', 'north_atlantic', etc.)
     * @return array|null Array of cyclones or null on error
     */
    public function getCycloneData($basin = 'all', $region = 'australian') {
        try {
            // Validate region
            if (!isset($this->regions[$region])) {
                $region = 'australian';  // Default to Australian region
            }

            $regionBounds = $this->regions[$region];
            error_log("IBTrACS: Filtering for region: {$regionBounds['name']}");

            // Check if we have cached parsed data for this region
            $parsedCache = $this->getParsedCache($basin, $region);
            if ($parsedCache !== null) {
                error_log("IBTrACS: Using cached parsed data for region: $region");
                return $parsedCache;
            }

            // Get cached or download CSV data
            $csvPath = $this->getCachedOrDownloadCSV($basin);

            if (!$csvPath) {
                $this->lastError = "Failed to download or access IBTrACS data";
                return null;
            }

            // Parse the CSV file with region filtering
            $cyclones = $this->parseCSV($csvPath, $regionBounds);

            // Cache the parsed data for future requests
            $this->saveParsedCache($basin, $region, $cyclones);

            return $cyclones;

        } catch (Exception $e) {
            $this->lastError = $e->getMessage();
            error_log("IBTraCSParser Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get cached CSV or download from IBTrACS
     */
    private function getCachedOrDownloadCSV($basin) {
        $cacheFile = $this->cacheDir . "ibtracs_{$basin}.csv";

        // Check if cache exists and is not expired
        if (file_exists($cacheFile)) {
            $cacheAge = time() - filemtime($cacheFile);

            if ($cacheAge < $this->cacheExpiry) {
                error_log("IBTrACS: Using cached data (age: " . round($cacheAge / 3600, 1) . " hours)");
                return $cacheFile;
            }
        }

        // Download new data
        error_log("IBTrACS: Downloading new data for basin: $basin");

        if (!isset($this->ibtracsUrls[$basin])) {
            $basin = 'all';
        }

        $url = $this->ibtracsUrls[$basin];

        // Download with streaming to save memory
        $context = stream_context_create([
            'http' => [
                'timeout' => 60, // 60 second timeout
                'user_agent' => 'TCExplorer/1.0 (Educational Purpose)'
            ]
        ]);

        // Open source and destination streams
        $source = @fopen($url, 'r', false, $context);

        if ($source === false) {
            error_log("IBTrACS: Failed to open URL stream: $url");

            // Try to use expired cache if download fails
            if (file_exists($cacheFile)) {
                error_log("IBTrACS: Using expired cache as fallback");
                return $cacheFile;
            }

            return null;
        }

        $destination = @fopen($cacheFile, 'w');

        if ($destination === false) {
            error_log("IBTrACS: Failed to open cache file for writing: $cacheFile");
            fclose($source);
            return null;
        }

        // Stream copy (memory efficient)
        $bytesWritten = stream_copy_to_stream($source, $destination);

        fclose($source);
        fclose($destination);

        if ($bytesWritten === false || $bytesWritten === 0) {
            error_log("IBTrACS: Failed to download data");

            // Remove incomplete cache file
            if (file_exists($cacheFile)) {
                unlink($cacheFile);
            }

            return null;
        }

        error_log("IBTrACS: Downloaded and cached " . round($bytesWritten / 1024 / 1024, 2) . " MB");

        return $cacheFile;
    }

    /**
     * Get parsed cache file path for a given basin and region
     *
     * @param string $basin Basin identifier
     * @param string $region Region identifier
     * @return string Cache file path
     */
    private function getParsedCacheFilePath($basin, $region) {
        return $this->cacheDir . "parsed_{$basin}_{$region}.json";
    }

    /**
     * Get cached parsed data if it exists and is valid
     *
     * @param string $basin Basin identifier
     * @param string $region Region identifier
     * @return array|null Parsed cyclone data or null if cache invalid/missing
     */
    private function getParsedCache($basin, $region) {
        $cacheFile = $this->getParsedCacheFilePath($basin, $region);

        // Check if parsed cache exists
        if (!file_exists($cacheFile)) {
            return null;
        }

        // Check if cache is expired
        $cacheAge = time() - filemtime($cacheFile);
        if ($cacheAge >= $this->cacheExpiry) {
            error_log("IBTrACS: Parsed cache expired (age: " . round($cacheAge / 3600, 1) . " hours)");
            return null;
        }

        // Load and decode cached data
        $jsonData = @file_get_contents($cacheFile);
        if ($jsonData === false) {
            error_log("IBTrACS: Failed to read parsed cache file");
            return null;
        }

        $data = json_decode($jsonData, true);
        if ($data === null || !is_array($data)) {
            error_log("IBTrACS: Invalid parsed cache data");
            return null;
        }

        error_log("IBTrACS: Loaded parsed cache (age: " . round($cacheAge / 3600, 1) . " hours, " . count($data) . " storms)");
        return $data;
    }

    /**
     * Save parsed cyclone data to cache
     *
     * @param string $basin Basin identifier
     * @param string $region Region identifier
     * @param array $cyclones Parsed cyclone data
     * @return bool Success status
     */
    private function saveParsedCache($basin, $region, $cyclones) {
        $cacheFile = $this->getParsedCacheFilePath($basin, $region);

        // Encode as JSON
        $jsonData = json_encode($cyclones, JSON_PRETTY_PRINT);
        if ($jsonData === false) {
            error_log("IBTrACS: Failed to encode parsed data as JSON");
            return false;
        }

        // Save to file
        $result = @file_put_contents($cacheFile, $jsonData);
        if ($result === false) {
            error_log("IBTrACS: Failed to save parsed cache file");
            return false;
        }

        $sizeKB = round(strlen($jsonData) / 1024, 2);
        error_log("IBTrACS: Saved parsed cache for region $region ({$sizeKB} KB, " . count($cyclones) . " storms)");
        return true;
    }

    /**
     * Parse IBTrACS CSV file with region filtering
     *
     * @param string $csvPath Path to CSV file
     * @param array $regionBounds Region bounds for filtering
     * @return array Array of cyclones
     */
    private function parseCSV($csvPath, $regionBounds) {
        $handle = fopen($csvPath, 'r');

        if (!$handle) {
            throw new Exception("Failed to open CSV file: $csvPath");
        }

        // IBTrACS has 2 header rows: column names and units
        $headers = fgetcsv($handle); // First row: column names
        $units = fgetcsv($handle);    // Second row: units

        // Map column names to indices
        $colMap = array_flip($headers);

        // Required columns
        $requiredCols = ['SID', 'ISO_TIME', 'LAT', 'LON', 'WMO_WIND', 'WMO_PRES', 'BASIN', 'NATURE'];
        foreach ($requiredCols as $col) {
            if (!isset($colMap[$col])) {
                throw new Exception("Required column missing: $col");
            }
        }

        // Track which storms have points in the region (memory-efficient filtering)
        $stormsInRegion = [];
        $storms = [];
        $lineCount = 0;
        $skippedStorms = [];

        while (($row = fgetcsv($handle)) !== false) {
            $lineCount++;

            // Skip empty rows
            if (count($row) < count($headers)) {
                continue;
            }

            $sid = trim($row[$colMap['SID']]);
            $lat = $this->parseFloat($row[$colMap['LAT']]);
            $lon = $this->parseFloat($row[$colMap['LON']]);

            // Skip if no valid coordinates
            if ($lat === null || $lon === null) {
                continue;
            }

            // Check if this storm is already marked as outside region
            if (isset($skippedStorms[$sid])) {
                continue;
            }

            // Check if point is in region (early filtering to save memory)
            $inRegion = $this->isInRegion($lat, $lon, $regionBounds);

            // If we haven't seen this storm yet and it's not in region, skip it
            if (!isset($storms[$sid]) && !$inRegion) {
                // Mark this storm to skip all future points
                $skippedStorms[$sid] = true;
                continue;
            }

            // If this point is in region, mark the storm as relevant
            if ($inRegion) {
                $stormsInRegion[$sid] = true;
            }

            // Create track point
            $point = [
                'time' => $row[$colMap['ISO_TIME']],
                'lat' => $lat,
                'lon' => $lon,
                'wind' => $this->parseFloat($row[$colMap['WMO_WIND']] ?? ''), // knots
                'pressure' => $this->parseFloat($row[$colMap['WMO_PRES']] ?? ''), // hPa
                'basin' => $row[$colMap['BASIN']] ?? '',
                'nature' => $row[$colMap['NATURE']] ?? ''
            ];

            // Add to storm group only if we know it's in region or might be
            if (!isset($storms[$sid])) {
                $storms[$sid] = [
                    'sid' => $sid,
                    'name' => $row[$colMap['NAME']] ?? '',
                    'track' => []
                ];
            }

            $storms[$sid]['track'][] = $point;
        }

        fclose($handle);

        // Keep only storms that have at least one point in the region
        $filteredStorms = [];
        foreach ($storms as $sid => $storm) {
            if (isset($stormsInRegion[$sid])) {
                $filteredStorms[$sid] = $storm;
            }
        }

        error_log("IBTrACS: Parsed $lineCount lines into " . count($filteredStorms) . " storms in {$regionBounds['name']} (filtered from " . count($storms) . " total)");

        // Convert to cyclone format
        return $this->convertToCycloneFormat($filteredStorms);
    }

    /**
     * Check if coordinates are in a specified region
     *
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @param array $bounds Region bounds array with north, south, east, west
     * @return bool True if coordinates are in region
     */
    private function isInRegion($lat, $lon, $bounds) {
        // Handle longitude wraparound for regions crossing dateline
        $lonInRange = false;
        if ($bounds['west'] > $bounds['east']) {
            // Region crosses dateline (e.g., South Pacific: 135°E to 120°W)
            $lonInRange = ($lon >= $bounds['west'] || $lon <= $bounds['east']);
        } else {
            $lonInRange = ($lon >= $bounds['west'] && $lon <= $bounds['east']);
        }

        $latInRange = ($lat >= $bounds['south'] && $lat <= $bounds['north']);

        return $latInRange && $lonInRange;
    }

    /**
     * Convert IBTrACS storm data to application's cyclone format
     */
    private function convertToCycloneFormat($storms) {
        $cyclones = [];
        $id = 1;

        foreach ($storms as $storm) {
            // Skip storms with no track points
            if (empty($storm['track'])) {
                continue;
            }

            // Sort track by time
            usort($storm['track'], function($a, $b) {
                return strcmp($a['time'], $b['time']);
            });

            // Calculate cyclone properties
            $maxWind = 0;
            $minPressure = 9999;
            $maxCategory = 0;
            $landfall = false;

            // Convert track points
            $track = [];
            foreach ($storm['track'] as $point) {
                // Convert wind from knots to km/h
                $windKmh = $point['wind'] !== null ? round($point['wind'] * 1.852, 1) : null;

                // Calculate category from wind speed
                $category = $windKmh !== null ? $this->windToCategory($windKmh) : 0;

                // Track maximums
                if ($windKmh !== null && $windKmh > $maxWind) {
                    $maxWind = $windKmh;
                }
                if ($point['pressure'] !== null && $point['pressure'] < $minPressure) {
                    $minPressure = $point['pressure'];
                }
                if ($category > $maxCategory) {
                    $maxCategory = $category;
                }

                // Check for landfall (simplified check)
                if ($this->isOverAustralia($point['lat'], $point['lon'])) {
                    $landfall = true;
                }

                $track[] = [
                    'lat' => $point['lat'],
                    'lon' => $point['lon'],
                    'time' => $point['time'],
                    'wind' => $windKmh,
                    'pressure' => $point['pressure'],
                    'category' => $category
                ];
            }

            // Calculate duration
            $startTime = strtotime($storm['track'][0]['time']);
            $endTime = strtotime($storm['track'][count($storm['track']) - 1]['time']);
            $durationHours = ($endTime - $startTime) / 3600;
            $durationDays = round($durationHours / 24, 1);

            // Extract year from start time
            $year = (int)date('Y', $startTime);

            // Create cyclone object
            $cyclones[] = [
                'id' => $id++,
                'original_id' => $storm['sid'],
                'name' => !empty($storm['name']) ? trim($storm['name']) : 'Unnamed',
                'year' => $year,
                'maxCategory' => $maxCategory,
                'maxWind' => round($maxWind, 1),
                'minPressure' => $minPressure < 9999 ? round($minPressure, 1) : null,
                'duration' => $durationDays,
                'duration_hours' => $durationHours,
                'landfall' => $landfall,
                'genesis_lat' => $storm['track'][0]['lat'],
                'genesis_lon' => $storm['track'][0]['lon'],
                'track' => $track,
                'start_date' => $storm['track'][0]['time'],
                'end_date' => $storm['track'][count($storm['track']) - 1]['time']
            ];
        }

        return $cyclones;
    }

    /**
     * Convert wind speed (km/h) to Saffir-Simpson category
     */
    private function windToCategory($windKmh) {
        if ($windKmh < 63) return 0;
        if ($windKmh < 118) return 1;
        if ($windKmh < 154) return 2;
        if ($windKmh < 178) return 3;
        if ($windKmh < 209) return 4;
        return 5;
    }

    /**
     * Check if coordinates are over Australian landmass (simplified)
     */
    private function isOverAustralia($lat, $lon) {
        // Simplified bounding box for Australian landmass
        return ($lat > -39 && $lat < -10 && $lon > 113 && $lon < 154);
    }

    /**
     * Parse float value, return null if invalid
     */
    private function parseFloat($value) {
        $value = trim($value);

        if ($value === '' || $value === ' ') {
            return null;
        }

        $parsed = floatval($value);

        // IBTrACS uses large negative values for missing data
        if ($parsed < -900) {
            return null;
        }

        return $parsed;
    }

    /**
     * Get the last error message
     */
    public function getLastError() {
        return $this->lastError;
    }

    /**
     * Clear the cache (for testing/debugging)
     */
    public function clearCache() {
        $csvFiles = glob($this->cacheDir . "ibtracs_*.csv");
        $parsedFiles = glob($this->cacheDir . "parsed_*.json");

        $files = array_merge($csvFiles, $parsedFiles);

        foreach ($files as $file) {
            unlink($file);
        }

        error_log("IBTrACS: Cleared " . count($csvFiles) . " CSV and " . count($parsedFiles) . " parsed cache files");

        return count($files);
    }
}
