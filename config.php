<?php
/**
 * Configuration file for Tropical Cyclone Visualization
 * 
 * Modify these settings based on your environment and data sources
 */

// Database Configuration (for future use)
define('DB_HOST', 'localhost');
define('DB_NAME', 'cyclone_viz');
define('DB_USER', 'root');
define('DB_PASS', '');

// Data Paths
define('DATA_PATH', __DIR__ . '/data/');
define('CACHE_PATH', __DIR__ . '/cache/');
define('LOG_PATH', __DIR__ . '/logs/');

// dp4df Data URL and File Patterns
// Data source: https://climate.mri-jma.go.jp/pub/d4pdf/tropical_cyclone_tracks/
// Reference: Yoshida et al. (GRL, 2017) https://doi.org/10.1029/2017JD028017
define('DP4DF_BASE_URL', 'https://climate.mri-jma.go.jp/pub/d4pdf/tropical_cyclone_tracks/');

define('DP4DF_FILE_PATTERNS', [
    'current' => [
        'prefix' => 'xytrackk319b_HPB_m',
        'ensemble_members' => 100,
        'time_period' => '1951-2011',
        'suffix' => '_1951-2011.txt'
    ],
    '2k' => [
        'prefix' => 'xytrackk319b_HFB_2K_',
        'ensemble_members' => 90,
        'time_period' => '2051-2111',
        'suffix' => '_2051-2111.txt',
        'sst_models' => ['CC', 'GF', 'HA', 'MI', 'MP', 'MR']
    ],
    '4k' => [
        'prefix' => 'xytrackk319b_HFB_4K_',
        'ensemble_members' => 90,
        'time_period' => '2051-2111',
        'suffix' => '_2051-2111.txt',
        'sst_models' => ['CC', 'GF', 'HA', 'MI', 'MP', 'MR']
    ]
]);

// Geographic Boundaries (Australian Region)
define('BOUNDS', [
    'north' => -5,
    'south' => -45,
    'east' => 160,
    'west' => 105
]);

// Cyclone Intensity Categories (Australian Scale)
define('INTENSITY_CATEGORIES', [
    1 => ['min_wind' => 63, 'max_wind' => 88, 'color' => '#1f78b4'],
    2 => ['min_wind' => 89, 'max_wind' => 117, 'color' => '#33a02c'],
    3 => ['min_wind' => 118, 'max_wind' => 159, 'color' => '#ff7f00'],
    4 => ['min_wind' => 160, 'max_wind' => 199, 'color' => '#e31a1c'],
    5 => ['min_wind' => 200, 'max_wind' => 999, 'color' => '#6a3d9a']
]);

// API Settings
define('API_RATE_LIMIT', 100); // requests per hour
define('API_CACHE_DURATION', 3600); // seconds
define('API_DEBUG_MODE', isset($_GET['debug']) && $_GET['debug'] === 'true');

// Map Settings
define('MAP_DEFAULT_CENTER', [-25.2744, 133.7751]);
define('MAP_DEFAULT_ZOOM', 4);
define('MAP_MIN_ZOOM', 3);
define('MAP_MAX_ZOOM', 10);

// Data Processing Settings
define('TRACK_SIMPLIFICATION_TOLERANCE', 0.01); // degrees
define('MIN_TRACK_POINTS', 3);
define('LANDFALL_BUFFER_KM', 50);

// Export Settings
define('EXPORT_FORMATS', ['csv', 'json', 'geojson']);
define('MAX_EXPORT_RECORDS', 10000);

// Performance Settings
define('ENABLE_CACHING', true);
define('CACHE_LIFETIME', 86400); // 24 hours
define('MAX_MEMORY_LIMIT', '512M');
define('EXECUTION_TIME_LIMIT', 300); // 5 minutes

// NetCDF Processing (if extension available)
define('NETCDF_AVAILABLE', extension_loaded('netcdf'));
define('NETCDF_VARIABLES', [
    'track_id' => 'track_id',
    'latitude' => 'lat',
    'longitude' => 'lon',
    'time' => 'time',
    'wind_speed' => 'max_wind',
    'pressure' => 'min_pres',
    'category' => 'category'
]);

// Logging Settings
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR
define('LOG_FILE_PREFIX', 'cyclone_viz_');
define('LOG_ROTATION_DAYS', 7);

// Security Settings
define('ALLOWED_ORIGINS', [
    'http://localhost',
    'https://www.unsw.edu.au',
    'https://ssci.unsw.edu.au'
]);

// Feature Flags
define('FEATURES', [
    'ensemble_selection' => false,
    'track_animation' => true,
    'density_maps' => false,
    'statistical_analysis' => false,
    'user_authentication' => false
]);

// Error Messages
define('ERROR_MESSAGES', [
    'data_not_found' => 'Cyclone data not found for the specified scenario',
    'invalid_scenario' => 'Invalid climate scenario specified',
    'processing_error' => 'Error processing cyclone data',
    'export_limit' => 'Export limit exceeded',
    'rate_limit' => 'API rate limit exceeded'
]);

// Create required directories if they don't exist
$requiredDirs = [DATA_PATH, CACHE_PATH, LOG_PATH];
foreach ($requiredDirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Load environment-specific overrides if available
$envConfig = __DIR__ . '/config.local.php';
if (file_exists($envConfig)) {
    require_once $envConfig;
}
?>