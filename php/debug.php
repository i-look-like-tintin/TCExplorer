<?php

// Enable gzip compression for responses
$compressionEnabled = false;
if (extension_loaded('zlib') &&
    !ob_get_level() &&
    strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false) {
    ob_start('ob_gzhandler');
    $compressionEnabled = true;
}

header('Content-Type: application/json');

$debug = [
    'current_dir' => __DIR__,
    'files_exist' => [
        'config' => file_exists(__DIR__ . '/config.php'),
        'IBTraCSParser' => file_exists(__DIR__ . '/IBTraCSParser.php'),
        'api' => file_exists(__DIR__ . '/api.php'),
    ],
    'cache_path' => __DIR__ . '/cache/',
    'cache_exists' => is_dir(__DIR__ . '/cache/'),
    'ibtracs_cache' => is_dir(__DIR__ . '/cache/ibtracs/'),
    'ibtracs_files' => is_dir(__DIR__ . '/cache/ibtracs/') ? scandir(__DIR__ . '/cache/ibtracs/') : [],
    'php_version' => PHP_VERSION,
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'zlib_extension' => extension_loaded('zlib'),
    'compression_enabled' => $compressionEnabled,
    'client_accepts_gzip' => strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false,
];

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
