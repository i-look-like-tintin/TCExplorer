# TCExplorer Azure Deployment - Context Document

**Date**: October 14, 2025
**Project**: TCExplorer v2.0.0 - Tropical Cyclone Visualization
**Deployment**: Azure App Service (Linux/PHP 8.1)
**Current Instance**: https://tcexplorertest.azurewebsites.net

---

## 📋 Project Overview

TCExplorer is an interactive web application for visualizing tropical cyclone data from:
- **d4PDF**: Simulated climate model data (4 scenarios: current, natural, +2K, +4K warming)
- **IBTrACS**: Real historical cyclone data from NOAA (1842-present, 8 global regions)

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Leaflet.js
- **Backend**: PHP 8.1 (API for data processing)
- **Data**: JSON (processed), CSV (raw IBTrACS)
- **Deployment**: Azure App Service (Linux), Apache/PHP-FPM
- **Version Control**: Git (direct push to Azure)

---

## 🏗️ Deployment Architecture

### Current Setup
- **Resource Group**: `tcexplorertest-rg`
- **App Service**: `TCExplorerTest`
- **Location**: Australia East
- **Plan**: Basic B1 (1 Core, 1.75 GB RAM)
- **Runtime**: PHP 8.1 on Linux (Apache)

### File Structure on Azure
```
/home/site/wwwroot/
├── index.html                 # Main application
├── .htaccess                  # Apache configuration
├── .user.ini                  # PHP configuration (1536M memory, 300s timeout)
├── startup.sh                 # Azure startup script
├── composer.json              # PHP runtime detection
├── .deployment                # Azure deployment config
├── css/                       # Stylesheets
├── js/                        # Frontend JavaScript
│   ├── app.js
│   ├── data-manager.js
│   ├── map-manager.js
│   └── ...
├── php/                       # Backend PHP
│   ├── api.php               # Main API endpoint
│   ├── config.php            # Configuration (Azure-aware paths)
│   ├── IBTraCSParser.php     # IBTrACS data parser
│   ├── Dp4dfParser.php       # d4PDF data parser
│   ├── debug.php             # Debug endpoint
│   ├── cache/
│   │   ├── dp4df/           # d4PDF cache (empty, generated on-demand)
│   │   └── ibtracs/         # IBTrACS cache (pre-deployed)
│   │       ├── ibtracs_all.csv (314MB)
│   │       ├── parsed_all_australian.json (22MB)
│   │       ├── parsed_all_north_atlantic.json (45MB)
│   │       ├── parsed_all_western_pacific.json (72MB)
│   │       ├── parsed_all_eastern_pacific.json (31MB)
│   │       ├── parsed_all_north_indian.json (18MB)
│   │       └── parsed_all_south_indian.json (40MB)
│   ├── logs/                # Application logs
│   └── data/                # Empty, for future use
└── density_data/            # Pre-processed heatmap data
```

---

## 🔑 Critical Configuration Files

### 1. `.user.ini` (PHP Configuration)
**Purpose**: Override PHP defaults for Azure App Service
**Location**: Root directory
**Key Settings**:
```ini
memory_limit = 1536M              # Required for large JSON files
max_execution_time = 300          # 5 minutes for data processing
post_max_size = 200M
upload_max_filesize = 200M
```

**Why Critical**: Default Azure PHP has 128M memory and 30s timeout, causing 502 errors when loading large IBTrACS files.

### 2. `php/config.php` (Application Configuration)
**Purpose**: Azure-aware path configuration and CORS settings
**Key Features**:
- **Auto-detects Azure**: Uses `getenv('WEBSITE_SITE_NAME')` to detect Azure environment
- **Azure-specific paths**:
  - Cache: `D:/home/data/cache/` (persistent storage on Windows) OR `/home/site/wwwroot/php/cache/` (Linux)
  - Logs: `D:/home/LogFiles/application/` (Windows) OR `/home/site/wwwroot/php/logs/` (Linux)
- **Dynamic CORS**: Automatically adds Azure app URL to allowed origins

**Important Variables**:
```php
$isAzure = getenv('WEBSITE_SITE_NAME') !== false;
define('CACHE_PATH', '/home/site/wwwroot/php/cache/');  // Linux path
define('ALLOWED_ORIGINS', [..., "https://{$azureSiteName}.azurewebsites.net"]);
```

### 3. `.htaccess` (Apache Configuration)
**Purpose**: Apache server configuration for PHP handling and CORS
**Key Features**:
- PHP file handling
- CORS headers
- Cache control for static assets
- Security rules (block sensitive files)

### 4. `startup.sh` (Azure Startup Script)
**Purpose**: Initialize directories and permissions on container start
**What it does**:
```bash
mkdir -p /home/site/wwwroot/php/cache/{dp4df,ibtracs}
chmod -R 755 /home/site/wwwroot/php/{cache,logs,data}
```

**Configured in Azure**: App Service → Configuration → Startup Command: `startup.sh`

### 5. `.deployment` (Azure Deployment Config)
**Purpose**: Configure Azure deployment behavior
**Current Setting**:
```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false
```
**Why**: Disables Oryx build system (looks for .NET projects), allows direct PHP deployment.

---

## 🚀 Deployment Process Used

### Initial Setup
```bash
# Created Azure resources
az group create --name tcexplorertest-rg --location australiaeast
az appservice plan create --name tcexplorer-plan --resource-group tcexplorertest-rg --sku B1 --is-linux
az webapp create --name TCExplorerTest --resource-group tcexplorertest-rg --plan tcexplorer-plan --runtime "PHP:8.1"

# Configured startup script
az webapp config set --name TCExplorerTest --resource-group tcexplorertest-rg --startup-file "startup.sh"

# Disabled Oryx build
az webapp config appsettings set --name TCExplorerTest --resource-group tcexplorertest-rg --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false ENABLE_ORYX_BUILD=false
```

### Git Deployment Setup
```bash
# Configure local Git deployment
az webapp deployment source config-local-git --name TCExplorerTest --resource-group tcexplorertest-rg

# Set deployment credentials (one-time)
az webapp deployment user set --user-name <username> --password <password>

# Add Azure remote
git remote add azure https://<username>@tcexplorertest.scm.azurewebsites.net/TCExplorerTest.git

# Deploy (push main to master branch on Azure)
git push azure main:master
```

### Post-Deployment
```bash
# Restart to apply .user.ini settings
az webapp restart --name TCExplorerTest --resource-group tcexplorertest-rg

# Verify PHP settings
curl https://tcexplorertest.azurewebsites.net/php/debug.php
```

---

## 🐛 Issues Encountered and Solutions

### Issue 1: 404 Errors on PHP Files (Initial Deployment)
**Symptom**: `php/api.php` returned 404
**Cause**: Used `web.config` (Windows IIS) on Linux Azure App Service
**Solution**: Removed `web.config`, created `.htaccess` for Apache/Linux

### Issue 2: 502 Bad Gateway Errors on Data Loading
**Symptom**: API returned 502 when loading IBTrACS data
**Cause**:
- Default PHP memory limit (128M) too low for 72MB JSON files
- Default timeout (30s) too short for parsing
**Solution**: Created `.user.ini` with:
- `memory_limit = 1536M`
- `max_execution_time = 300`

### Issue 3: Oryx Build Failures
**Symptom**: Deployment logs showed "Could not find .NET Core project file"
**Cause**: Azure's Oryx build system expected .NET/Node.js, found PHP
**Solution**: Disabled Oryx build via:
- `.deployment` file with `SCM_DO_BUILD_DURING_DEPLOYMENT=false`
- Azure app setting `ENABLE_ORYX_BUILD=false`

### Issue 4: Cache Files Too Large for GitHub
**Symptom**: 314MB CSV file exceeds GitHub's 100MB limit
**Cause**: IBTrACS CSV and large JSON files in cache
**Solution**:
- Deploy directly to Azure (no GitHub intermediary for this instance)
- Modified `.gitignore` to allow cache files: `!php/cache/ibtracs/*.{csv,json}`
- Direct Git push to Azure has no file size limits

### Issue 5: Missing Parsed Global Region File
**Symptom**: Global region had no pre-parsed cache file
**Status**: Accepted - file will be generated on first use (cached afterward)
**Impact**: First load of "Global" region takes ~30-60s, subsequent loads instant

---

## 📊 Data Files Explained

### IBTrACS Cache Files (Pre-deployed)
**Location**: `php/cache/ibtracs/`

| File | Size | Records | Purpose |
|------|------|---------|---------|
| `ibtracs_all.csv` | 314MB | 13,519+ | Raw CSV from NOAA, all cyclones worldwide |
| `parsed_all_australian.json` | 22MB | ~500 | Pre-parsed Australian region (105°E-160°E) |
| `parsed_all_north_atlantic.json` | 45MB | ~2,000 | Pre-parsed North Atlantic |
| `parsed_all_western_pacific.json` | 72MB | ~3,800 | Pre-parsed Western Pacific (largest) |
| `parsed_all_eastern_pacific.json` | 31MB | ~800 | Pre-parsed Eastern Pacific |
| `parsed_all_north_indian.json` | 18MB | ~300 | Pre-parsed North Indian |
| `parsed_all_south_indian.json` | 40MB | ~1,200 | Pre-parsed South Indian |
| `parsed_all_south_pacific.json` | (missing) | ~900 | Generated on first use |
| `parsed_all_global.json` | (missing) | 13,519+ | Generated on first use |

**Why Pre-deployed**: Avoids:
- Downloading 314MB CSV from NOAA on first load (timeout risk)
- Parsing CSV on-the-fly (memory intensive, slow)
- Better user experience (instant load for 6/8 regions)

### d4PDF Cache (Empty)
**Location**: `php/cache/dp4df/`
**Status**: Empty, populated on-demand from external server
**Source**: https://climate.mri-jma.go.jp/pub/d4pdf/tropical_cyclone_tracks/
**Why Not Pre-deployed**:
- Files are smaller, downloaded from external server as needed
- d4PDF server is reliable and fast
- Reduces deployment size

---

## 🔍 Debug Endpoints

### 1. Connection Test
```
GET https://tcexplorertest.azurewebsites.net/php/api.php?action=test
```
**Response**:
```json
{
  "success": true,
  "data": {
    "test": "connection",
    "base_url": "https://climate.mri-jma.go.jp/...",
    "connection_success": true,
    "cache_dir_exists": true,
    "cache_dir_writable": true,
    "php_version": "8.1.33"
  }
}
```

### 2. Debug Info
```
GET https://tcexplorertest.azurewebsites.net/php/debug.php
```
**Response**:
```json
{
  "current_dir": "/home/site/wwwroot/php",
  "files_exist": {...},
  "cache_path": "/home/site/wwwroot/php/cache/",
  "cache_exists": true,
  "ibtracs_cache": true,
  "ibtracs_files": [...],
  "php_version": "8.1.33",
  "memory_limit": "1536M",
  "max_execution_time": "300"
}
```

### 3. Real Historical Data API
```
GET https://tcexplorertest.azurewebsites.net/php/api.php?action=getRealHistoricalData&basin=all&region=australian&debug=true
```
**Expected**: JSON with cyclone data for Australian region

---

## 🔐 Security Considerations

### Current State
- ✅ HTTPS enabled by default (Azure certificate)
- ✅ CORS configured in `config.php` and `.htaccess`
- ✅ Sensitive files blocked in `.htaccess` (.git, .env, logs)
- ⚠️ Debug endpoint publicly accessible (`php/debug.php`)
- ⚠️ FTP enabled (default Azure setting)

### Recommendations for Production
1. **Remove debug.php** or restrict access by IP
2. **Disable FTP**: `az webapp config set --ftps-state Disabled`
3. **Enable Always On**: Prevents cold starts (requires Standard tier or higher)
4. **Custom Domain**: Add SSL certificate for custom domain
5. **Application Insights**: Enable monitoring and alerting

---

## 📈 Performance Metrics

### Current Performance (B1 Plan)
- **Initial Load (Australian region)**: ~2-3 seconds
- **Initial Load (Western Pacific)**: ~5-8 seconds
- **Initial Load (Global - first time)**: ~30-60 seconds
- **Subsequent Loads (cached)**: <1 second
- **Memory Usage**: ~200-800MB (peaks during large file parsing)
- **Cold Start**: ~3-5 seconds (without Always On)

### Scaling Recommendations
- **Testing/Development**: B1 Basic (current) - $13-15/month
- **Production (Low traffic)**: S1 Standard - $70/month (Always On, staging slots)
- **Production (High traffic)**: P1V2 Premium - $146/month (auto-scale, better performance)

---

## 🧪 Testing Checklist (Post-Deployment)

### Frontend Tests
- [ ] Application loads at `https://<appname>.azurewebsites.net`
- [ ] Interactive tutorial launches on first visit
- [ ] Map displays correctly with OpenStreetMap tiles
- [ ] Control panel is functional and responsive

### Simulated Data Tests (d4PDF)
- [ ] Load "Historical (1951-2011)" scenario
- [ ] Switch between ensemble members (1-9)
- [ ] Load "+2K Warming" with SST model selection
- [ ] Load "+4K Warming" scenario
- [ ] Year range slider filters data correctly
- [ ] Export to CSV works

### Real Historical Data Tests (IBTrACS)
- [ ] Switch to "Real Historical (BoM/IBTrACS)" data source
- [ ] Load Australian Region (should be fast)
- [ ] Load North Atlantic
- [ ] Load Western Pacific (largest file)
- [ ] Load Global (may be slow first time, fast afterward)
- [ ] Genesis points display correctly
- [ ] Category colors match legend

### Visualization Tests
- [ ] Show/Hide tracks
- [ ] Show/Hide genesis points
- [ ] Show/Hide intensity colors
- [ ] Heatmap view works
- [ ] Comparison mode (side-by-side scenarios)

### Mobile/Responsive Tests
- [ ] Works on mobile devices (iOS/Android)
- [ ] Works on tablets
- [ ] Horizontal and vertical orientations

---

## 🛠️ Maintenance Tasks

### Regular Tasks
1. **Monitor logs**: Check `/home/LogFiles/application/` for PHP errors
2. **Cache cleanup**: Clear old dp4df cache files if disk space becomes an issue
3. **IBTrACS updates**: Download new CSV annually and regenerate parsed files

### Updating IBTrACS Data
```bash
# 1. Download latest CSV from NOAA
curl -o php/cache/ibtracs/ibtracs_all.csv \
  https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.ALL.list.v04r01.csv

# 2. Delete old parsed files
rm php/cache/ibtracs/parsed_*.json

# 3. Load each region in the app to regenerate parsed files
# Or run IBTraCSParser.php directly via CLI

# 4. Commit and deploy
git add php/cache/ibtracs/
git commit -m "Update IBTrACS data to [date]"
git push azure main:master
```

### Scaling Up/Down
```bash
# Scale up to Standard S1
az appservice plan update --name tcexplorer-plan --resource-group tcexplorertest-rg --sku S1

# Scale out to 2 instances
az appservice plan update --name tcexplorer-plan --resource-group tcexplorertest-rg --number-of-workers 2

# Enable Always On (requires Standard or higher)
az webapp config set --name TCExplorerTest --resource-group tcexplorertest-rg --always-on true
```

---

## 📝 Git Configuration

### Remotes
```bash
git remote -v
# origin    (GitHub if you have one)
# azure     https://username@tcexplorertest.scm.azurewebsites.net/TCExplorerTest.git
```

### .gitignore Configuration
```
# Allows IBTrACS cache files for Azure deployment
!php/cache/ibtracs/*.csv
!php/cache/ibtracs/*.json

# Excludes d4PDF cache (generated on-demand)
php/cache/dp4df/

# Excludes large CSVs except in ibtracs cache
*.csv
```

### Branch Strategy
- **Local**: `main` branch
- **Azure**: Expects `master` branch
- **Deploy command**: `git push azure main:master`

---

## 🌐 URLs and Access

### Production URLs
- **Main App**: https://tcexplorertest.azurewebsites.net
- **API Endpoint**: https://tcexplorertest.azurewebsites.net/php/api.php
- **Debug Endpoint**: https://tcexplorertest.azurewebsites.net/php/debug.php

### Azure Portal Access
- **Portal**: https://portal.azure.com
- **Resource Group**: `tcexplorertest-rg`
- **App Service**: `TCExplorerTest`
- **SSH Access**: Via portal or `az webapp ssh`

### External Data Sources
- **d4PDF**: https://climate.mri-jma.go.jp/pub/d4pdf/tropical_cyclone_tracks/
- **IBTrACS**: https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/

---

## 📚 Key Lessons Learned

1. **Azure Linux vs Windows**:
   - Linux uses Apache/.htaccess, not IIS/web.config
   - Linux: `/home/site/wwwroot/`, Windows: `D:\home\site\wwwroot\`

2. **PHP Configuration**:
   - `.user.ini` required for custom PHP settings on Azure
   - Must restart app after deploying `.user.ini` changes
   - Default limits (128M/30s) are insufficient for large data files

3. **Deployment**:
   - Disable Oryx build for PHP projects (it expects .NET/Node)
   - Direct Git push to Azure has no file size limits (unlike GitHub)
   - Azure expects `master` branch, not `main`

4. **Performance**:
   - Pre-parsing and caching JSON is critical for UX
   - 72MB JSON file loads in memory, needs 1536M limit
   - Cold starts on B1 plan are acceptable for testing, not production

5. **Debugging**:
   - Create debug endpoints early
   - Azure logs are in `/home/LogFiles/`
   - 502 errors usually mean PHP crash (memory/timeout)

---

## 🔗 Related Documentation

- `AZURE_DEPLOYMENT.md` - Step-by-step deployment guide
- `README.md` - Project overview and features
- `TECHNICAL_DOCS.md` - Development documentation
- `USER_GUIDE.md` - End-user instructions

---

## 👥 Team & Contact

**Developed by Team Sharks**: May, Markey, Scott, Jackson, and Wheeler
**Version**: 2.0.0
**Last Updated**: October 14, 2025
**Deployment**: Azure App Service (TCExplorerTest)

---

*This context document was created to support resuming development and troubleshooting of the TCExplorer Azure deployment.*
