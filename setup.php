<?php
/**
 * Setup script for Tropical Cyclone Visualization
 * Run this script once to initialize the application structure
 */

echo "=== Tropical Cyclone Visualization Setup ===\n\n";

// Check PHP version
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    die("Error: PHP 7.4 or higher is required. Current version: " . PHP_VERSION . "\n");
}

echo "✓ PHP version " . PHP_VERSION . " is compatible\n";

// Check required extensions
$requiredExtensions = ['json', 'curl'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    } else {
        echo "✓ Extension '$ext' is loaded\n";
    }
}

if (!empty($missingExtensions)) {
    echo "\n⚠ Warning: The following extensions are missing: " . implode(', ', $missingExtensions) . "\n";
    echo "  The application may have limited functionality.\n";
}

// Optional extensions
$optionalExtensions = ['netcdf', 'gd'];
foreach ($optionalExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✓ Optional extension '$ext' is available\n";
    } else {
        echo "ℹ Optional extension '$ext' is not available\n";
    }
}

echo "\n";

// Create required directories
require_once 'config.php';

$directories = [
    DATA_PATH => 'Data directory',
    CACHE_PATH => 'Cache directory',
    LOG_PATH => 'Log directory'
];

foreach ($directories as $path => $description) {
    if (!file_exists($path)) {
        if (mkdir($path, 0755, true)) {
            echo "✓ Created $description: $path\n";
        } else {
            echo "✗ Failed to create $description: $path\n";
        }
    } else {
        echo "✓ $description already exists: $path\n";
    }
}

echo "\n";

// Check write permissions
foreach ($directories as $path => $description) {
    if (is_writable($path)) {
        echo "✓ $description is writable\n";
    } else {
        echo "✗ $description is not writable - please check permissions\n";
    }
}

echo "\n";

// Create sample configuration file if needed
$localConfigFile = __DIR__ . '/config.local.php';
if (!file_exists($localConfigFile)) {
    $sampleConfig = <<<'PHP'
<?php
/**
 * Local configuration overrides
 * This file is ignored by version control
 */

// Example: Override database settings for local development
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'my_local_db');
// define('DB_USER', 'my_user');
// define('DB_PASS', 'my_password');

// Example: Enable debug mode locally
// define('API_DEBUG_MODE', true);

// Example: Disable caching for development
// define('ENABLE_CACHING', false);
PHP;

    if (file_put_contents($localConfigFile, $sampleConfig)) {
        echo "✓ Created local configuration file: config.local.php\n";
    } else {
        echo "✗ Failed to create local configuration file\n";
    }
}

// Generate initial sample data
echo "\nWould you like to generate sample data? (y/n): ";
$response = trim(fgets(STDIN));

if (strtolower($response) === 'y') {
    echo "\nGenerating sample data...\n";
    require_once 'generate_sample_data.php';
}

// Test API endpoint
echo "\nTesting API endpoint...\n";
$testUrl = 'http://localhost' . dirname($_SERVER['SCRIPT_NAME']) . '/api.php?action=getScenarioMetadata&scenario=current';
$ch = curl_init($testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✓ API endpoint is accessible\n";
} else {
    echo "⚠ Could not reach API endpoint (HTTP $httpCode)\n";
    echo "  Make sure your web server is running\n";
}

// Summary
echo "\n=== Setup Complete ===\n";
echo "Next steps:\n";
echo "1. Ensure your web server (Apache) is running\n";
echo "2. Access the application at: http://localhost" . dirname($_SERVER['SCRIPT_NAME']) . "/\n";
echo "3. Place dp4df NetCDF files in the data directory when available\n";
echo "4. Modify config.local.php for environment-specific settings\n";
echo "\nFor more information, see README.md\n";
?>