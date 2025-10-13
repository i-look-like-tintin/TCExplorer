<?php
/**
 * Diagnostic script to troubleshoot file access and PHP configuration on Azure
 */

header('Content-Type: application/json');

$diagnostics = [];

// 1. PHP Configuration
$diagnostics['php'] = [
    'version' => PHP_VERSION,
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'file_uploads' => ini_get('file_uploads'),
    'allow_url_fopen' => ini_get('allow_url_fopen'),
    'zlib_compression' => extension_loaded('zlib')
];

// 2. Directory Information
$diagnostics['directories'] = [
    'current_working_dir' => getcwd(),
    'script_directory' => __DIR__,
    'cache_path' => __DIR__ . '/cache/ibtracs/'
];

// 3. Cache Directory Status
$cacheDir = __DIR__ . '/cache/ibtracs/';
$diagnostics['cache_directory'] = [
    'exists' => file_exists($cacheDir),
    'is_directory' => is_dir($cacheDir),
    'is_readable' => is_readable($cacheDir),
    'is_writable' => is_writable($cacheDir),
    'permissions' => file_exists($cacheDir) ? substr(sprintf('%o', fileperms($cacheDir)), -4) : 'N/A'
];

// 4. File Status
$csvFile = $cacheDir . 'ibtracs_all.csv';
$gzFile = $csvFile . '.gz';

$diagnostics['csv_file'] = [
    'path' => $csvFile,
    'exists' => file_exists($csvFile),
    'is_readable' => file_exists($csvFile) ? is_readable($csvFile) : false,
    'size_mb' => file_exists($csvFile) ? round(filesize($csvFile) / 1024 / 1024, 2) : 0,
    'permissions' => file_exists($csvFile) ? substr(sprintf('%o', fileperms($csvFile)), -4) : 'N/A'
];

$diagnostics['gz_file'] = [
    'path' => $gzFile,
    'exists' => file_exists($gzFile),
    'is_readable' => file_exists($gzFile) ? is_readable($gzFile) : false,
    'size_mb' => file_exists($gzFile) ? round(filesize($gzFile) / 1024 / 1024, 2) : 0,
    'permissions' => file_exists($gzFile) ? substr(sprintf('%o', fileperms($gzFile)), -4) : 'N/A'
];

// 5. Test decompression if .gz exists but .csv doesn't
if (file_exists($gzFile) && !file_exists($csvFile)) {
    $diagnostics['decompression_test'] = 'attempting';

    $gzHandle = @gzopen($gzFile, 'rb');
    if ($gzHandle) {
        // Try to read first few bytes
        $testRead = gzread($gzHandle, 1024);
        gzclose($gzHandle);

        $diagnostics['decompression_test'] = [
            'can_open_gz' => true,
            'can_read_gz' => strlen($testRead) > 0,
            'first_bytes_preview' => substr($testRead, 0, 100)
        ];
    } else {
        $diagnostics['decompression_test'] = [
            'can_open_gz' => false,
            'error' => error_get_last()
        ];
    }
}

// 6. Directory listing
if (is_dir($cacheDir)) {
    $files = @scandir($cacheDir);
    $diagnostics['directory_contents'] = $files ? $files : ['error' => 'Cannot read directory'];
} else {
    $diagnostics['directory_contents'] = 'Directory does not exist';
}

// 7. Environment variables
$diagnostics['environment'] = [
    'HOME' => getenv('HOME'),
    'WEBSITE_SITE_NAME' => getenv('WEBSITE_SITE_NAME'),
    'APPSETTING_WEBSITE_SITE_NAME' => getenv('APPSETTING_WEBSITE_SITE_NAME'),
    'is_azure' => !empty(getenv('WEBSITE_SITE_NAME'))
];

// 8. Error log location
$diagnostics['error_logging'] = [
    'log_errors' => ini_get('log_errors'),
    'error_log' => ini_get('error_log'),
    'display_errors' => ini_get('display_errors')
];

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
