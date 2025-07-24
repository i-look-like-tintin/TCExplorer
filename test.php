<?php
/**
 * Test script for d4PDF API connectivity
 * Run this to verify the application can fetch data
 */

require_once 'config.php';
require_once 'Dp4dfParser.php';

echo "=== d4PDF API Connection Test ===\n\n";

// Test basic connectivity
echo "1. Testing connection to d4PDF server...\n";
$testUrl = DP4DF_BASE_URL;
$headers = @get_headers($testUrl);

if ($headers && strpos($headers[0], '200') !== false) {
    echo "✓ Successfully connected to d4PDF server\n";
} else {
    echo "✗ Failed to connect to d4PDF server\n";
    echo "  URL: $testUrl\n";
    exit(1);
}

echo "\n2. Testing data file access...\n";

// Test scenarios
$tests = [
    [
        'name' => 'Historical (HPB)',
        'scenario' => 'current',
        'ensemble' => 1,
        'expected_file' => 'xytrackk319b_HPB_m001_1951-2011.txt'
    ],
    [
        'name' => '2K Warming (HFB_2K)',
        'scenario' => '2k',
        'ensemble' => 1,
        'sst' => 'CC',
        'expected_file' => 'xytrackk319b_HFB_2K_CC_m001_2051-2111.txt'
    ],
    [
        'name' => '4K Warming (HFB_4K)',
        'scenario' => '4k',
        'ensemble' => 1,
        'sst' => 'CC',
        'expected_file' => 'xytrackk319b_HFB_4K_CC_m001_2051-2111.txt'
    ]
];

$parser = new Dp4dfParser();

foreach ($tests as $test) {
    echo "\nTesting: {$test['name']}\n";
    echo "Expected file: {$test['expected_file']}\n";
    
    $url = DP4DF_BASE_URL . $test['expected_file'];
    $headers = @get_headers($url);
    
    if ($headers && strpos($headers[0], '200') !== false) {
        echo "✓ File exists on server\n";
        
        // Try to parse first few lines
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'header' => "Range: bytes=0-1000\r\n"
            ]
        ]);
        
        $sample = @file_get_contents($url, false, $context);
        if ($sample) {
            $lines = explode("\n", $sample);
            $dataLines = 0;
            foreach ($lines as $line) {
                if (!empty($line) && $line[0] !== '#') {
                    $dataLines++;
                }
            }
            echo "✓ File contains data ($dataLines lines in sample)\n";
        }
    } else {
        echo "✗ File not found on server\n";
    }
}

echo "\n3. Testing data parsing...\n";

// Try to parse one small dataset
$testData = $parser->getCycloneData('current', 1);
if ($testData !== null && count($testData) > 0) {
    echo "✓ Successfully parsed cyclone data\n";
    echo "  Found " . count($testData) . " cyclones in ensemble 1\n";
    
    // Show sample cyclone
    if (isset($testData[0])) {
        $sample = $testData[0];
        echo "\n  Sample cyclone:\n";
        echo "  - ID: {$sample['id']}\n";
        echo "  - Year: {$sample['year']}\n";
        echo "  - Max Wind: {$sample['maxWind']} km/h\n";
        echo "  - Track Points: " . count($sample['track']) . "\n";
    }
} else {
    echo "✗ Failed to parse cyclone data\n";
}

echo "\n4. Testing cache functionality...\n";
$cacheDir = CACHE_PATH . 'dp4df/';
if (is_dir($cacheDir) && is_writable($cacheDir)) {
    echo "✓ Cache directory is writable\n";
    
    $cacheFiles = glob($cacheDir . '*.json');
    if (count($cacheFiles) > 0) {
        echo "✓ Found " . count($cacheFiles) . " cached files\n";
    } else {
        echo "ℹ No cached files yet\n";
    }
} else {
    echo "✗ Cache directory not writable\n";
}

echo "\n=== Test Summary ===\n";
echo "If all tests passed, the application should work correctly.\n";
echo "If some tests failed, check:\n";
echo "- Internet connectivity\n";
echo "- d4PDF server availability\n";
echo "- PHP timeout settings\n";
echo "- File permissions\n";
?>