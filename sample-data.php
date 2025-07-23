<?php
/**
 * Generate sample cyclone data for testing
 * Run this script to create JSON files that simulate dp4df NetCDF data
 */

require_once 'config.php';

class SampleDataGenerator {
    private $cycloneNames = [
        'Anika', 'Billy', 'Charlotte', 'Dylan', 'Esther', 
        'Freddy', 'Gabrielle', 'Herman', 'Ilsa', 'Jasper',
        'Kirrily', 'Lincoln', 'Megan', 'Neville', 'Olga',
        'Paul', 'Quincey', 'Ruby', 'Sean', 'Tanya',
        'Vernon', 'Wallace', 'Yvette', 'Zane', 'Alfred'
    ];
    
    public function generate() {
        echo "Generating sample cyclone data...\n";
        
        foreach (['current', '2k', '4k'] as $scenario) {
            $this->generateScenarioData($scenario);
        }
        
        echo "Sample data generation complete!\n";
    }
    
    private function generateScenarioData($scenario) {
        $config = DP4DF_FILE_PATTERNS[$scenario];
        $data = [
            'metadata' => [
                'scenario' => $scenario,
                'time_period' => $config['time_period'],
                'ensemble_members' => $config['ensemble_members'],
                'bounds' => BOUNDS,
                'generated_date' => date('Y-m-d H:i:s')
            ],
            'ensemble_data' => []
        ];
        
        // Generate data for multiple ensemble members (just 3 for demo)
        for ($ensemble = 1; $ensemble <= min(3, $config['ensemble_members']); $ensemble++) {
            $ensembleData = [
                'ensemble_id' => $ensemble,
                'cyclones' => $this->generateCyclonesForEnsemble($scenario, $ensemble)
            ];
            $data['ensemble_data'][] = $ensembleData;
        }
        
        // Save to JSON file
        $filename = DATA_PATH . "sample_{$scenario}_cyclones.json";
        file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
        echo "Generated: $filename\n";
    }
    
    private function generateCyclonesForEnsemble($scenario, $ensembleId) {
        $cyclones = [];
        
        // Scenario-specific parameters
        $params = [
            'current' => ['count' => rand(10, 15), 'intensity_bias' => 0],
            '2k' => ['count' => rand(12, 18), 'intensity_bias' => 0.2],
            '4k' => ['count' => rand(15, 25), 'intensity_bias' => 0.4]
        ];
        
        $scenarioParams = $params[$scenario];
        $yearRange = $this->getYearRange($scenario);
        
        for ($i = 0; $i < $scenarioParams['count']; $i++) {
            $year = rand($yearRange['start'], $yearRange['end']);
            $cyclone = $this->generateSingleCyclone($year, $i, $scenarioParams['intensity_bias']);
            $cyclones[] = $cyclone;
        }
        
        return $cyclones;
    }
    
    private function getYearRange($scenario) {
        switch ($scenario) {
            case 'current':
                return ['start' => 1990, 'end' => 2020];
            case '2k':
                return ['start' => 2040, 'end' => 2070];
            case '4k':
                return ['start' => 2070, 'end' => 2100];
            default:
                return ['start' => 2020, 'end' => 2030];
        }
    }
    
    private function generateSingleCyclone($year, $index, $intensityBias) {
        $name = $this->cycloneNames[$index % count($this->cycloneNames)];
        $month = rand(1, 12);
        $day = rand(1, 28);
        $startDate = sprintf('%04d-%02d-%02d', $year, $month, $day);
        
        // Generate genesis location
        $genesis = $this->generateGenesisLocation();
        
        // Generate track
        $track = $this->generateRealisticTrack($genesis, $startDate, $intensityBias);
        
        // Calculate statistics
        $stats = $this->calculateCycloneStats($track);
        
        return [
            'id' => sprintf('TC_%04d_%03d', $year, $index + 1),
            'name' => $name,
            'year' => $year,
            'start_date' => $startDate,
            'end_date' => $track[count($track) - 1]['datetime'],
            'genesis_lat' => $genesis['lat'],
            'genesis_lon' => $genesis['lon'],
            'max_category' => $stats['max_category'],
            'max_wind_speed' => $stats['max_wind'],
            'min_pressure' => $stats['min_pressure'],
            'ace' => $stats['ace'], // Accumulated Cyclone Energy
            'track_length_km' => $stats['track_length'],
            'duration_hours' => count($track) * 6,
            'landfall' => $stats['landfall'],
            'track' => $track
        ];
    }
    
    private function generateGenesisLocation() {
        // Common genesis regions around Australia
        $regions = [
            ['lat_range' => [-8, -12], 'lon_range' => [125, 135]],   // Timor Sea
            ['lat_range' => [-10, -15], 'lon_range' => [140, 150]],  // Coral Sea
            ['lat_range' => [-15, -20], 'lon_range' => [110, 120]],  // Indian Ocean
            ['lat_range' => [-12, -18], 'lon_range' => [115, 125]]   // Northwest shelf
        ];
        
        $region = $regions[array_rand($regions)];
        
        return [
            'lat' => $this->randomFloat($region['lat_range'][0], $region['lat_range'][1]),
            'lon' => $this->randomFloat($region['lon_range'][0], $region['lon_range'][1])
        ];
    }
    
    private function generateRealisticTrack($genesis, $startDate, $intensityBias) {
        $track = [];
        $lat = $genesis['lat'];
        $lon = $genesis['lon'];
        $datetime = strtotime($startDate);
        
        // Initial conditions
        $category = 0; // Tropical low
        $direction = rand(180, 270); // Generally southward
        $speed = rand(10, 20); // km/h
        
        // Lifecycle parameters
        $maxLifetime = rand(5, 20) * 4; // 5-20 days in 6-hour intervals
        $peakTime = $maxLifetime * 0.4; // Peak intensity at 40% of lifetime
        
        for ($t = 0; $t < $maxLifetime; $t++) {
            // Update position
            $distance = $speed * 6 / 111; // 6 hours of movement in degrees
            $lat += $distance * cos(deg2rad($direction));
            $lon += $distance * sin(deg2rad($direction));
            
            // Steering flow changes
            if ($lat < -20) {
                $direction += rand(-5, 15); // Turn more eastward in higher latitudes
            }
            
            // Speed variations
            $speed = max(5, min(50, $speed + rand(-5, 5)));
            
            // Intensity evolution
            if ($t < $peakTime) {
                // Intensification phase
                if (rand(0, 100) < (70 + $intensityBias * 100)) {
                    $category = min(5, $category + 1);
                }
            } else {
                // Weakening phase
                if (rand(0, 100) < 40) {
                    $category = max(0, $category - 1);
                }
            }
            
            // Environmental factors
            if ($lat < -25 || $lat > -8) {
                // Weaken in unfavorable latitudes
                $category = max(0, $category - 1);
            }
            
            // Calculate wind and pressure from category
            $windSpeed = $this->categoryToWind($category);
            $pressure = $this->windToPressure($windSpeed);
            
            $track[] = [
                'datetime' => date('Y-m-d H:i:s', $datetime),
                'lat' => round($lat, 3),
                'lon' => round($lon, 3),
                'category' => $category,
                'wind_speed_kt' => $windSpeed,
                'pressure_hpa' => $pressure,
                'storm_speed_kmh' => round($speed, 1),
                'direction_deg' => round($direction, 0)
            ];
            
            $datetime += 6 * 3600; // Add 6 hours
            
            // Check if out of bounds
            if ($lat < BOUNDS['south'] || $lat > BOUNDS['north'] || 
                $lon < BOUNDS['west'] || $lon > BOUNDS['east']) {
                break;
            }
        }
        
        return $track;
    }
    
    private function calculateCycloneStats($track) {
        $maxCategory = 0;
        $maxWind = 0;
        $minPressure = 1013;
        $ace = 0;
        $trackLength = 0;
        $landfall = false;
        
        for ($i = 0; $i < count($track); $i++) {
            $point = $track[$i];
            
            $maxCategory = max($maxCategory, $point['category']);
            $maxWind = max($maxWind, $point['wind_speed_kt']);
            $minPressure = min($minPressure, $point['pressure_hpa']);
            
            // ACE calculation (sum of squared wind speeds in knots / 10000)
            if ($point['wind_speed_kt'] >= 35) {
                $ace += pow($point['wind_speed_kt'], 2) / 10000;
            }
            
            // Track length
            if ($i > 0) {
                $prevPoint = $track[$i - 1];
                $distance = $this->haversineDistance(
                    $prevPoint['lat'], $prevPoint['lon'],
                    $point['lat'], $point['lon']
                );
                $trackLength += $distance;
            }
            
            // Simple landfall check (Australia mainland)
            if ($this->isOverLand($point['lat'], $point['lon'])) {
                $landfall = true;
            }
        }
        
        return [
            'max_category' => $maxCategory,
            'max_wind' => $maxWind,
            'min_pressure' => $minPressure,
            'ace' => round($ace, 2),
            'track_length' => round($trackLength, 0),
            'landfall' => $landfall
        ];
    }
    
    private function categoryToWind($category) {
        // Australian tropical cyclone scale (knots)
        $winds = [
            0 => rand(20, 33),  // Tropical low
            1 => rand(34, 47),  // Category 1
            2 => rand(48, 63),  // Category 2
            3 => rand(64, 85),  // Category 3
            4 => rand(86, 107), // Category 4
            5 => rand(108, 140) // Category 5
        ];
        
        return $winds[$category] ?? 20;
    }
    
    private function windToPressure($windKt) {
        // Rough approximation: pressure = 1013 - (wind^2 / 100)
        return max(880, round(1013 - pow($windKt, 2) / 100));
    }
    
    private function isOverLand($lat, $lon) {
        // Very simplified Australia landmass check
        if ($lat > -39 && $lat < -10 && $lon > 113 && $lon < 154) {
            // More detailed check would go here
            return rand(0, 100) < 30; // 30% chance for this simple demo
        }
        return false;
    }
    
    private function haversineDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // km
        
        $latDiff = deg2rad($lat2 - $lat1);
        $lonDiff = deg2rad($lon2 - $lon1);
        
        $a = sin($latDiff / 2) * sin($latDiff / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDiff / 2) * sin($lonDiff / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }
    
    private function randomFloat($min, $max) {
        return $min + mt_rand() / mt_getrandmax() * ($max - $min);
    }
}

// Run the generator
$generator = new SampleDataGenerator();
$generator->generate();
?>