<?php
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
];

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
