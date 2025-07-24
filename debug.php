<?php
/**
 * Debug script to identify issues with the API
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>TC Visualization Debug</h1>";

// Check PHP version
echo "<h2>1. PHP Version</h2>";
echo "Current PHP Version: " . PHP_VERSION . "<br>";
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    echo "❌ PHP 7.4 or higher is required<br>";
} else {
    echo "✅ PHP version is compatible<br>";
}

// Check if required files exist
echo "<h2>2. Required Files</h2>";
$requiredFiles = [
    'config.php',
    'Dp4dfParser.php',
    'api.php'
];

foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "✅ $file exists<br>";
    } else {
        echo "❌ $file is missing<br>";
    }
}

// Check if config.php has syntax errors
echo "<h2>3. Config File Check</h2>";
if (file_exists('config.php')) {
    try {
        require_once 'config.php';
        echo "✅ config.php loaded successfully<br>";
        echo "Data path: " . (defined('DATA_PATH') ? DATA_PATH : 'NOT DEFINED') . "<br>";
        echo "Cache path: " . (defined('CACHE_PATH') ? CACHE_PATH : 'NOT DEFINED') . "<br>";
    } catch (Exception $e) {
        echo "❌ Error in config.php: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ config.php not found<br>";
}

// Check if directories exist and are writable
echo "<h2>4. Directory Permissions</h2>";
$directories = [
    'data' => DATA_PATH ?? './data/',
    'cache' => CACHE_PATH ?? './cache/',
    'cache/dp4df' => (CACHE_PATH ?? './cache/') . 'dp4df/',
    'logs' => LOG_PATH ?? './logs/'
];

foreach ($directories as $name => $path) {
    if (file_exists($path)) {
        if (is_writable($path)) {
            echo "✅ $name directory exists and is writable: $path<br>";
        } else {
            echo "⚠️ $name directory exists but is not writable: $path<br>";
        }
    } else {
        echo "❌ $name directory does not exist: $path<br>";
        // Try to create it
        if (@mkdir($path, 0755, true)) {
            echo "✅ Created $name directory<br>";
        } else {
            echo "❌ Failed to create $name directory<br>";
        }
    }
}

// Test Dp4dfParser.php
echo "<h2>5. Parser Check</h2>";
if (file_exists('Dp4dfParser.php')) {
    try {
        require_once 'Dp4dfParser.php';
        echo "✅ Dp4dfParser.php loaded successfully<br>";
        
        // Check if class exists
        if (class_exists('Dp4dfParser')) {
            echo "✅ Dp4dfParser class exists<br>";
        } else {
            echo "❌ Dp4dfParser class not found<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error in Dp4dfParser.php: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ Dp4dfParser.php not found<br>";
}

// Test remote connectivity
echo "<h2>6. Remote Server Connectivity</h2>";
if (defined('DP4DF_BASE_URL')) {
    $url = DP4DF_BASE_URL;
    echo "Testing connection to: $url<br>";
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'method' => 'HEAD'
        ]
    ]);
    
    $headers = @get_headers($url, 1, $context);
    if ($headers !== false) {
        echo "✅ Successfully connected to d4PDF server<br>";
    } else {
        echo "❌ Cannot connect to d4PDF server<br>";
        echo "This might be a network issue or the server might be down<br>";
    }
} else {
    echo "❌ DP4DF_BASE_URL not defined<br>";
}

// Test API directly
echo "<h2>7. API Test</h2>";
echo "Testing API endpoint...<br>";

// Create a simple test request
$testUrl = "api.php?action=getScenarioMetadata&scenario=current";
echo "Test URL: $testUrl<br>";

// Check if we can include api.php
if (file_exists('api.php')) {
    echo "✅ api.php exists<br>";
    
    // Try to make a request
    $ch = curl_init("http://localhost" . dirname($_SERVER['REQUEST_URI']) . "/" . $testUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Response Code: $httpCode<br>";
    if ($httpCode === 200) {
        echo "✅ API is responding<br>";
        echo "Response: <pre>" . htmlspecialchars(substr($response, 0, 200)) . "...</pre>";
    } else {
        echo "❌ API returned error code $httpCode<br>";
        echo "Response: <pre>" . htmlspecialchars($response) . "</pre>";
    }
} else {
    echo "❌ api.php not found<br>";
}

// PHP settings that might cause issues
echo "<h2>8. PHP Settings</h2>";
echo "max_execution_time: " . ini_get('max_execution_time') . " seconds<br>";
echo "memory_limit: " . ini_get('memory_limit') . "<br>";
echo "allow_url_fopen: " . (ini_get('allow_url_fopen') ? 'Yes' : 'No') . "<br>";

if (!ini_get('allow_url_fopen')) {
    echo "❌ allow_url_fopen is disabled - this will prevent fetching remote data<br>";
}

echo "<h2>9. Recommendations</h2>";
echo "<ul>";
echo "<li>If files are missing, make sure all files were copied correctly</li>";
echo "<li>If directories don't exist, the setup script should create them</li>";
echo "<li>If allow_url_fopen is disabled, enable it in php.ini</li>";
echo "<li>Check Apache error logs for more details about the 500 error</li>";
echo "</ul>";

phpinfo();
?>