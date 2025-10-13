#!/bin/bash
# Azure App Service startup script for TCExplorer

echo "Starting TCExplorer initialization..."

# Create cache directories if they don't exist
mkdir -p /home/site/wwwroot/php/cache/dp4df
mkdir -p /home/site/wwwroot/php/cache/ibtracs
mkdir -p /home/site/wwwroot/php/logs
mkdir -p /home/site/wwwroot/php/data

# Set proper permissions
chmod -R 755 /home/site/wwwroot/php/cache
chmod -R 755 /home/site/wwwroot/php/logs
chmod -R 755 /home/site/wwwroot/php/data

# Ensure PHP can write to cache
chown -R www-data:www-data /home/site/wwwroot/php/cache 2>/dev/null || true
chown -R www-data:www-data /home/site/wwwroot/php/logs 2>/dev/null || true

echo "TCExplorer initialization complete."
echo "Cache directories created and permissions set."

# Start Apache/PHP-FPM (handled by Azure, but this ensures our setup is ready)
