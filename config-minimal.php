<?php
/**
 * Minimal configuration file for Tropical Cyclone Visualization
 * Copy this to config.php if the main config file is missing
 */

// Basic paths
define('DATA_PATH', __DIR__ . '/data/');
define('CACHE_PATH', __DIR__ . '/cache/');
define('LOG_PATH', __DIR__ . '/logs/');

// d4PDF Data URL
define('DP4DF_BASE_URL', 'https://climate.mri-jma.go.jp/pub/d4pdf/tropical_cyclone_tracks/');

// Data patterns
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

// Geographic boundaries
define('BOUNDS', [
    'north' => -5,
    'south' => -45,
    'east' => 160,
    'west' => 105
]);

// API settings
define('ENABLE_CACHING', true);
define('CACHE_LIFETIME', 86400); // 24 hours

// Security
define('ALLOWED_ORIGINS', ['*']); // Allow all for development

// Create directories if they don't exist
$dirs = [DATA_PATH, CACHE_PATH, LOG_PATH, CACHE_PATH . 'dp4df/'];
foreach ($dirs as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }
}
?>