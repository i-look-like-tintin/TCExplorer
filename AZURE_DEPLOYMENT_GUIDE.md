# Azure Deployment Guide - Step-by-Step Instructions

**Complete guide for deploying TCExplorer to a new Azure Web App**

This guide will walk you through creating a fresh Azure Web App deployment for TCExplorer from scratch. Follow these steps carefully to avoid common pitfalls.

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] **Azure Account**: Active subscription ([Sign up free](https://azure.microsoft.com/free/))
- [ ] **Azure CLI**: Installed and updated ([Installation guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- [ ] **Git**: Installed and configured
- [ ] **TCExplorer Project**: Complete source code with all files
- [ ] **Command Line Access**: Terminal/PowerShell/Bash
- [ ] **~30 minutes**: For first-time setup

### Verify Prerequisites

```bash
# Check Azure CLI
az --version
# Should show version 2.x or higher

# Check Git
git --version
# Should show version 2.x or higher

# Login to Azure
az login
# Opens browser for authentication

# Verify login
az account show
# Shows your subscription details
```

---

## 🎯 Part 1: Prepare Your Project

### Step 1.1: Verify Required Files

Ensure your project has these Azure-specific files:

```bash
# Navigate to project directory
cd /path/to/TCExplorer

# Check for required files
ls -la .user.ini .htaccess startup.sh composer.json .deployment

# All should exist. If missing, see "Missing Files" section below
```

**Required Files**:
- ✅ `.user.ini` - PHP configuration (memory/timeout limits)
- ✅ `.htaccess` - Apache configuration (CORS, PHP handling)
- ✅ `startup.sh` - Azure startup script (directory creation)
- ✅ `composer.json` - PHP runtime detection
- ✅ `.deployment` - Azure deployment configuration
- ✅ `php/config.php` - Azure-aware path configuration

### Step 1.2: Verify IBTrACS Cache Files

Check if pre-parsed IBTrACS files exist:

```bash
ls -lh php/cache/ibtracs/

# Should show:
# ibtracs_all.csv (314MB)
# parsed_all_australian.json (22MB)
# parsed_all_north_atlantic.json (45MB)
# parsed_all_western_pacific.json (72MB)
# parsed_all_eastern_pacific.json (31MB)
# parsed_all_north_indian.json (18MB)
# parsed_all_south_indian.json (40MB)
```

**If Missing**: See "Regenerating IBTrACS Cache" section at end of this guide.

### Step 1.3: Commit All Changes

```bash
# Check git status
git status

# Add any uncommitted files
git add .

# Commit
git commit -m "Prepare for Azure deployment"

# Verify clean working tree
git status
# Should show: "nothing to commit, working tree clean"
```

---

## 🏗️ Part 2: Create Azure Resources

### Step 2.1: Set Variables

Choose unique names for your Azure resources:

```bash
# Set your variables (CUSTOMIZE THESE!)
RESOURCE_GROUP="tcexplorer-prod-rg"          # Resource group name
APP_NAME="tcexplorer-prod"                    # Must be globally unique!
LOCATION="australiaeast"                      # Or: eastus, westeurope, etc.
PLAN_NAME="tcexplorer-plan"                   # App Service Plan name
PLAN_SKU="B1"                                 # B1=Basic, S1=Standard, P1V2=Premium

# Test if app name is available
az webapp list --query "[?name=='$APP_NAME']" -o table
# If empty, name is available. If not, choose a different name.
```

**App Name Requirements**:
- Must be globally unique across all of Azure
- Only lowercase letters, numbers, and hyphens
- 2-60 characters
- Will become: `https://<APP_NAME>.azurewebsites.net`

**Location Options**:
- `australiaeast` - Australia East (Sydney)
- `australiasoutheast` - Australia Southeast (Melbourne)
- `eastus` - US East (Virginia)
- `westeurope` - West Europe (Netherlands)
- See all: `az account list-locations -o table`

**SKU Options**:
- `B1` - Basic ($13-15/month, 1.75GB RAM, good for testing)
- `S1` - Standard ($70/month, Always On, staging slots)
- `P1V2` - Premium ($146/month, auto-scale, better performance)

### Step 2.2: Create Resource Group

```bash
# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Verify creation
az group show --name $RESOURCE_GROUP
```

### Step 2.3: Create App Service Plan

```bash
# Create App Service Plan (Linux)
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku $PLAN_SKU \
  --is-linux

# Verify creation
az appservice plan show \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "{Name:name, SKU:sku.name, Location:location, OS:kind}"
```

**Expected Output**:
```json
{
  "Name": "tcexplorer-plan",
  "SKU": "B1",
  "Location": "australiaeast",
  "OS": "linux"
}
```

### Step 2.4: Create Web App

```bash
# Create Web App with PHP 8.1
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "PHP:8.1"

# Verify creation
az webapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "{Name:name, State:state, URL:defaultHostName, PHP:siteConfig.linuxFxVersion}"
```

**Expected Output**:
```json
{
  "Name": "tcexplorer-prod",
  "State": "Running",
  "URL": "tcexplorer-prod.azurewebsites.net",
  "PHP": "PHP|8.1"
}
```

✅ **Checkpoint**: Your web app is created! Visit `https://<APP_NAME>.azurewebsites.net` - you should see a default Azure page.

---

## ⚙️ Part 3: Configure Azure App

### Step 3.1: Set Startup Script

```bash
# Configure startup script
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "startup.sh"

# Verify
az webapp config show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "appCommandLine"
# Should output: "startup.sh"
```

### Step 3.2: Disable Oryx Build System

```bash
# Disable Oryx build (prevents .NET project search errors)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=false \
    ENABLE_ORYX_BUILD=false

# Verify
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "[?name=='SCM_DO_BUILD_DURING_DEPLOYMENT' || name=='ENABLE_ORYX_BUILD']"
```

### Step 3.3: Set Optional App Settings

```bash
# Set additional app settings (optional but recommended)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    WEBSITE_TIME_ZONE="AUS Eastern Standard Time" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true

# For production, add:
#   WEBSITE_HTTPLOGGING_RETENTION_DAYS=7
#   WEBSITE_LOAD_CERTIFICATES=* (if using custom SSL)
```

### Step 3.4: Enable Logging (Recommended)

```bash
# Enable application logging
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  --web-server-logging filesystem

# Verify
az webapp log config show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## 📦 Part 4: Deploy Your Code

### Step 4.1: Configure Local Git Deployment

```bash
# Enable local Git deployment
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# This returns a Git URL like:
# https://$APP_NAME.scm.azurewebsites.net/$APP_NAME.git
# Save this URL, you'll need it next
```

### Step 4.2: Set Deployment Credentials

**Option A: Use Application-Scope Credentials** (Recommended)

Get credentials from Azure Portal:
1. Go to https://portal.azure.com
2. Navigate to your App Service (`$APP_NAME`)
3. Click "Deployment Center" → "Local Git/FTPS credentials"
4. Under "Application scope", copy the username and password
5. Username will be like: `$tcexplorer-prod`
6. Click "Copy" next to password to copy it

**Option B: Create User-Scope Credentials**

```bash
# Set your own deployment credentials
az webapp deployment user set \
  --user-name deployuser \
  --password 'YourSecurePassword123!'

# Note: This creates account-wide credentials (works for all your web apps)
```

### Step 4.3: Add Azure Remote to Git

```bash
# Add Azure as a Git remote
git remote add azure https://<username>@$APP_NAME.scm.azurewebsites.net/$APP_NAME.git

# Or with embedded credentials (not recommended for shared machines):
# git remote add azure https://<username>:<password>@$APP_NAME.scm.azurewebsites.net/$APP_NAME.git

# Verify remote was added
git remote -v
# Should show:
# azure   https://...@tcexplorer-prod.scm.azurewebsites.net/tcexplorer-prod.git (fetch)
# azure   https://...@tcexplorer-prod.scm.azurewebsites.net/tcexplorer-prod.git (push)
```

### Step 4.4: Deploy Code to Azure

```bash
# Push to Azure (main branch to master)
git push azure main:master

# You'll be prompted for password if not embedded in URL
# Enter the deployment password from Step 4.2

# Wait for deployment to complete (may take 2-5 minutes)
```

**Expected Output**:
```
Enumerating objects: 400, done.
Counting objects: 100% (400/400), done.
Delta compression using up to 8 threads
Compressing objects: 100% (380/380), done.
Writing objects: 100% (400/400), 850 MiB | 5.00 MiB/s, done.
Total 400 (delta 300), reused 0 (delta 0)
remote: Deploy Async
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id '...'.
remote: Deployment successful.
To https://tcexplorer-prod.scm.azurewebsites.net/tcexplorer-prod.git
 * [new branch]      main -> master
```

**If Deployment Fails**: See "Troubleshooting Deployment" section below.

### Step 4.5: Restart App to Apply .user.ini

```bash
# Restart the app (required for .user.ini to take effect)
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Wait ~30 seconds for restart to complete
```

---

## ✅ Part 5: Verify Deployment

### Step 5.1: Check PHP Configuration

```bash
# Test debug endpoint
curl -s https://$APP_NAME.azurewebsites.net/php/debug.php | jq

# Or open in browser:
# https://<APP_NAME>.azurewebsites.net/php/debug.php
```

**Expected Response**:
```json
{
  "current_dir": "/home/site/wwwroot/php",
  "files_exist": {
    "config": true,
    "IBTraCSParser": true,
    "api": true
  },
  "cache_exists": true,
  "ibtracs_cache": true,
  "ibtracs_files": [
    "ibtracs_all.csv",
    "parsed_all_australian.json",
    ...
  ],
  "php_version": "8.1.33",
  "memory_limit": "1536M",      ← Should be 1536M, not 128M
  "max_execution_time": "300"    ← Should be 300, not 30
}
```

**Critical Checks**:
- ✅ `memory_limit` must be `1536M` (not `128M`)
- ✅ `max_execution_time` must be `300` (not `30`)
- ✅ `ibtracs_files` should list 7 JSON files + 1 CSV

**If memory_limit is still 128M**:
```bash
# Restart again and wait longer
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
sleep 60

# Check again
curl -s https://$APP_NAME.azurewebsites.net/php/debug.php | jq '.memory_limit, .max_execution_time'
```

### Step 5.2: Test API Endpoints

```bash
# Test connection endpoint
curl -s https://$APP_NAME.azurewebsites.net/php/api.php?action=test | jq

# Expected: {"success": true, "data": {...}}

# Test IBTrACS endpoint (Australian region)
curl -s "https://$APP_NAME.azurewebsites.net/php/api.php?action=getRealHistoricalData&basin=all&region=australian" | jq '.success, .data.total_cyclones'

# Expected: true, ~500
```

### Step 5.3: Test Web Application

Open in browser: `https://<APP_NAME>.azurewebsites.net`

**Manual Testing Checklist**:

1. **Application Loads**:
   - [ ] Page loads without errors
   - [ ] Map displays correctly
   - [ ] No 404 errors in browser console

2. **Simulated Data (d4PDF)**:
   - [ ] Select "Simulated (d4PDF Climate Models)"
   - [ ] Choose "Historical (1951-2011)" scenario
   - [ ] Cyclone tracks appear on map
   - [ ] Change ensemble member (1-9)
   - [ ] Year range slider works

3. **Real Historical Data (IBTrACS)**:
   - [ ] Select "Real Historical (BoM/IBTrACS)"
   - [ ] Choose "Australian Region"
   - [ ] Data loads (should be fast ~2-3 seconds)
   - [ ] Change to "Western Pacific"
   - [ ] Data loads (may take 5-8 seconds)
   - [ ] Try "Global" (may take 30-60s first time)

4. **Visualizations**:
   - [ ] Toggle "Show Tracks" on/off
   - [ ] Toggle "Show Genesis Points" on/off
   - [ ] Toggle "Show Intensity Colours" on/off
   - [ ] Heatmap view works
   - [ ] Comparison mode works

5. **Export**:
   - [ ] Click "Export Data (CSV)"
   - [ ] CSV file downloads successfully

### Step 5.4: Monitor Logs

```bash
# Stream live logs (useful for debugging)
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Or download logs for analysis
az webapp log download --name $APP_NAME --resource-group $RESOURCE_GROUP

# SSH into the app (for advanced debugging)
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
```

---

## 🎉 Part 6: Post-Deployment (Optional)

### Step 6.1: Enable Always On (Standard/Premium Tier Only)

```bash
# Prevents cold starts, keeps app always warm
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --always-on true

# Note: Requires S1 Standard tier or higher, will fail on B1 Basic
```

### Step 6.2: Set up Custom Domain (Optional)

```bash
# Add custom domain (requires domain ownership verification)
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname cyclones.yourdomain.com

# Enable HTTPS redirect
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# Bind SSL certificate (if you have one)
az webapp config ssl bind \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### Step 6.3: Configure Application Insights (Recommended)

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app $APP_NAME-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Link to Web App
az monitor app-insights component connect-webapp \
  --app $APP_NAME-insights \
  --resource-group $RESOURCE_GROUP \
  --web-app $APP_NAME

# Get instrumentation key
az monitor app-insights component show \
  --app $APP_NAME-insights \
  --resource-group $RESOURCE_GROUP \
  --query "instrumentationKey"
```

### Step 6.4: Set up Deployment Slots (Standard/Premium Only)

```bash
# Create staging slot
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging

# Deploy to staging first for testing
git remote add azure-staging https://$APP_NAME-staging.scm.azurewebsites.net/$APP_NAME.git
git push azure-staging main:master

# Swap staging to production after testing
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --target-slot production
```

---

## 🔒 Security Hardening (Production)

### Essential Security Steps

```bash
# 1. Disable FTP access
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --ftps-state Disabled

# 2. Set minimum TLS version
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --min-tls-version 1.2

# 3. Enable HTTPS only
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# 4. Restrict access by IP (optional)
az webapp config access-restriction add \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --rule-name "Office" \
  --action Allow \
  --ip-address 203.0.113.0/24 \
  --priority 100
```

### Remove Debug Endpoint (Production)

```bash
# SSH into app and remove debug.php
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP

# In SSH session:
rm /home/site/wwwroot/php/debug.php
exit
```

Or remove from local repository and redeploy:
```bash
git rm php/debug.php
git commit -m "Remove debug endpoint for production"
git push azure main:master
```

---

## 🔄 Updating Your Deployment

### Update Application Code

```bash
# Make changes locally
git add .
git commit -m "Update feature X"

# Push to Azure
git push azure main:master

# App will automatically redeploy
```

### Update IBTrACS Data

```bash
# 1. Download latest CSV
cd php/cache/ibtracs/
curl -O https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.ALL.list.v04r01.csv
mv ibtracs.ALL.list.v04r01.csv ibtracs_all.csv

# 2. Regenerate parsed files (see section below)

# 3. Deploy
git add php/cache/ibtracs/
git commit -m "Update IBTrACS data to $(date +%Y-%m-%d)"
git push azure main:master
```

### Scale Up/Down

```bash
# Scale up to Standard S1
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku S1

# Scale out to 2 instances (horizontal scaling)
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --number-of-workers 2

# Scale back to Basic B1
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --number-of-workers 1
```

---

## 🐛 Troubleshooting

### Issue: Deployment Hangs or Fails

**Symptom**: `git push` hangs or shows errors

**Solution 1**: Check credentials
```bash
# Get publishing credentials
az webapp deployment list-publishing-credentials \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "{username:publishingUserName, url:scmUri}"

# Update git remote with correct credentials
git remote set-url azure https://<username>@$APP_NAME.scm.azurewebsites.net/$APP_NAME.git
```

**Solution 2**: Check deployment logs
```bash
az webapp log deployment list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Issue: 502 Bad Gateway on Data Loading

**Symptom**: App loads, but clicking "Real Historical Data" gives 502 error

**Diagnosis**:
```bash
# Check PHP settings
curl https://$APP_NAME.azurewebsites.net/php/debug.php | jq '.memory_limit, .max_execution_time'
```

**If memory_limit is 128M**:
1. Verify `.user.ini` was deployed:
   ```bash
   az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
   ls -la /home/site/wwwroot/.user.ini
   cat /home/site/wwwroot/.user.ini
   ```

2. Restart app:
   ```bash
   az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
   sleep 60
   ```

3. Check again

**If still not working**: `.user.ini` might not be in the right location or formatted incorrectly.

### Issue: 404 on PHP Files

**Symptom**: `php/api.php` returns 404 Not Found

**Solution**: Check if files were deployed
```bash
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
ls -la /home/site/wwwroot/php/
# Should see: api.php, config.php, IBTraCSParser.php, etc.
```

**If files are missing**:
```bash
# Check git push actually succeeded
git log --oneline -5

# Try pushing again
git push azure main:master --force
```

### Issue: "Could not find .NET Core project file"

**Symptom**: Deployment logs show Oryx build errors

**Solution**: Oryx build should be disabled
```bash
# Check settings
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "[?name=='SCM_DO_BUILD_DURING_DEPLOYMENT' || name=='ENABLE_ORYX_BUILD']"

# If not set, disable:
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=false \
    ENABLE_ORYX_BUILD=false

# Restart and redeploy
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
git push azure main:master --force
```

### Issue: Slow Data Loading (Even After Caching)

**Solution 1**: Increase memory limit further
```bash
# Edit .user.ini locally
# Change: memory_limit = 2048M

git add .user.ini
git commit -m "Increase memory to 2GB"
git push azure main:master
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

**Solution 2**: Upgrade App Service Plan
```bash
# Upgrade to S1 Standard (2 cores, 3.5GB RAM)
az appservice plan update \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku S1
```

### Issue: Changes Not Appearing After Deployment

**Solution**:
```bash
# 1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

# 2. Restart app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# 3. Check if files were actually updated
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
ls -lt /home/site/wwwroot/ | head -10
# Check timestamps - should be recent
```

---

## 📚 Appendix A: Missing Files Recovery

If you're setting up a deployment from a repository that's missing Azure-specific files, create them:

### Create .user.ini
```bash
cat > .user.ini << 'EOF'
memory_limit = 1536M
max_execution_time = 300
post_max_size = 200M
upload_max_filesize = 200M
display_errors = Off
log_errors = On
error_log = /home/LogFiles/php_errors.log
opcache.enable = 1
EOF
```

### Create .htaccess
```bash
cat > .htaccess << 'EOF'
RewriteEngine On

<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Accept"

php_value memory_limit 1024M
php_value max_execution_time 300

<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    Header set Cache-Control "max-age=604800, public"
</FilesMatch>

<FilesMatch "(^\.git|^\.env|composer\.json|\.log)">
    Require all denied
</FilesMatch>
EOF
```

### Create startup.sh
```bash
cat > startup.sh << 'EOF'
#!/bin/bash
echo "Starting TCExplorer initialization..."
mkdir -p /home/site/wwwroot/php/cache/dp4df
mkdir -p /home/site/wwwroot/php/cache/ibtracs
mkdir -p /home/site/wwwroot/php/logs
mkdir -p /home/site/wwwroot/php/data
chmod -R 755 /home/site/wwwroot/php/cache
chmod -R 755 /home/site/wwwroot/php/logs
chmod -R 755 /home/site/wwwroot/php/data
echo "TCExplorer initialization complete."
EOF

chmod +x startup.sh
```

### Create composer.json
```bash
cat > composer.json << 'EOF'
{
  "name": "team-sharks/tc-explorer",
  "description": "Interactive visualization of tropical cyclone tracks",
  "version": "2.0.0",
  "type": "project",
  "license": "GPL-3.0",
  "require": {
    "php": ">=7.4"
  },
  "config": {
    "platform": {
      "php": "8.0"
    }
  }
}
EOF
```

### Create .deployment
```bash
cat > .deployment << 'EOF'
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false
EOF
```

### Commit all files
```bash
git add .user.ini .htaccess startup.sh composer.json .deployment
git commit -m "Add Azure deployment configuration files"
```

---

## 📚 Appendix B: Regenerating IBTrACS Cache

If you need to regenerate the parsed IBTrACS JSON files:

### Method 1: Using the Web App (Easiest)

1. Deploy app with only the CSV file (`ibtracs_all.csv`)
2. Load the app in browser
3. Select "Real Historical" data source
4. Select each region one by one:
   - Australian Region
   - North Atlantic
   - Western Pacific
   - Eastern Pacific
   - North Indian
   - South Indian
   - South Pacific
   - Global
5. Wait for each to load (first load is slow, creates cache file)
6. SSH into Azure and download the generated files:

```bash
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP

# In SSH session:
cd /home/site/wwwroot/php/cache/ibtracs
ls -lh parsed_*.json

# Exit SSH
exit

# Use az webapp ssh with command to copy files
# Or use FTP/FTPS to download (if enabled)
```

### Method 2: Running Parser Locally

1. Ensure you have PHP 8.1+ installed locally
2. Run the parser for each region:

```bash
cd php/

# Create test script
cat > generate_cache.php << 'PHP'
<?php
require_once 'config.php';
require_once 'IBTraCSParser.php';

$regions = ['australian', 'north_atlantic', 'western_pacific',
            'eastern_pacific', 'north_indian', 'south_indian',
            'south_pacific', 'global'];

foreach ($regions as $region) {
    echo "Processing $region...\n";
    $parser = new IBTraCSParser(CACHE_PATH);
    $data = $parser->getCycloneData('all', $region);
    echo "  Found " . count($data) . " cyclones\n";
}

echo "Done!\n";
PHP

# Run script
php -d memory_limit=2G generate_cache.php

# Verify files created
ls -lh cache/ibtracs/parsed_*.json

# Remove test script
rm generate_cache.php
```

3. Commit the generated files:
```bash
git add cache/ibtracs/parsed_*.json
git commit -m "Add pre-parsed IBTrACS cache files"
```

---

## 📚 Appendix C: Cost Estimation

### Monthly Costs by Tier

**Basic B1** (Current):
- **Cost**: ~$13-15 USD/month
- **Specs**: 1 Core, 1.75GB RAM, 10GB storage
- **Limits**: No Always On, no auto-scale, no staging slots
- **Good for**: Development, testing, low-traffic production

**Standard S1**:
- **Cost**: ~$70 USD/month
- **Specs**: 1 Core, 1.75GB RAM, 50GB storage
- **Features**: Always On, auto-scale (up to 10 instances), 5 staging slots
- **Good for**: Production with moderate traffic

**Premium P1V2**:
- **Cost**: ~$146 USD/month
- **Specs**: 1 Core, 3.5GB RAM, 250GB storage
- **Features**: Always On, auto-scale (up to 30 instances), better performance
- **Good for**: High-traffic production, mission-critical apps

**Cost Saving Tips**:
- Stop app when not in use (testing): $0/month when stopped
- Use shared dev/test subscription: 25% discount
- Use Azure credits: Students get $100/year free

### Bandwidth Costs

Azure includes:
- **First 100GB/month**: Free outbound
- **Next 9.9TB**: $0.087/GB
- **Over 10TB**: $0.083/GB

**Typical Usage for TCExplorer**:
- Average page load: ~3MB (includes map tiles, scripts, initial data)
- Average data API request: ~5-75MB (depending on region)
- **Estimate**: 1,000 users/month = ~8GB = **Free**
- **Estimate**: 10,000 users/month = ~80GB = **Free**

---

## 📚 Appendix D: Useful Azure CLI Commands

```bash
# View all app services in subscription
az webapp list --output table

# View app service details
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP

# View app service metrics
az monitor metrics list \
  --resource $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Web/sites" \
  --metric "Http2xx,Http5xx,ResponseTime,CpuTime,MemoryWorkingSet"

# View recent deployments
az webapp deployment list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table

# Download all logs
az webapp log download \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file ~/azure-logs.zip

# Stream logs in real-time
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# SSH into app
az webapp ssh \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# View environment variables
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Stop app (saves costs when not in use)
az webapp stop \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Start app
az webapp start \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Delete app (careful!)
az webapp delete \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Delete entire resource group (careful!)
az group delete \
  --name $RESOURCE_GROUP \
  --yes --no-wait
```

---

## 📞 Support and Resources

### Official Documentation
- **Azure App Service**: https://docs.microsoft.com/azure/app-service/
- **PHP on Azure**: https://docs.microsoft.com/azure/app-service/configure-language-php
- **Azure CLI Reference**: https://docs.microsoft.com/cli/azure/webapp

### TCExplorer Documentation
- **DEPLOYMENT_CONTEXT.md**: Detailed context for this deployment
- **AZURE_DEPLOYMENT.md**: Original deployment documentation
- **TECHNICAL_DOCS.md**: Developer documentation
- **USER_GUIDE.md**: End-user guide

### Community Support
- **Azure Forums**: https://docs.microsoft.com/answers/products/azure
- **Stack Overflow**: Tag: `azure-web-app-service`, `php`, `azure-cli`

### Emergency Support
If critical issues arise:
1. Check Azure Service Health: https://status.azure.com/
2. Review deployment logs: Portal → App Service → Deployment Center
3. Check application logs: Portal → App Service → Log stream
4. Contact Azure Support: Portal → Help + support

---

## ✅ Deployment Checklist

Use this checklist to ensure nothing is missed:

**Pre-Deployment**:
- [ ] Azure CLI installed and logged in
- [ ] Project files ready with all Azure configs
- [ ] IBTrACS cache files present (540MB total)
- [ ] Git repository clean and committed
- [ ] Unique app name chosen and verified available

**Azure Resources**:
- [ ] Resource group created
- [ ] App Service Plan created (Linux, PHP 8.1)
- [ ] Web App created
- [ ] Startup script configured
- [ ] Oryx build disabled
- [ ] Logging enabled

**Deployment**:
- [ ] Git remote added
- [ ] Code pushed to Azure
- [ ] Deployment completed successfully
- [ ] App restarted after deployment

**Verification**:
- [ ] Debug endpoint shows memory_limit=1536M
- [ ] Debug endpoint shows max_execution_time=300
- [ ] Test API endpoint returns success
- [ ] IBTrACS API endpoint works
- [ ] Web app loads in browser
- [ ] Simulated data loads (d4PDF)
- [ ] Real historical data loads (IBTrACS)
- [ ] All regions tested
- [ ] Export CSV works

**Post-Deployment (Optional)**:
- [ ] Always On enabled (if S1+)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate bound (if custom domain)
- [ ] Application Insights enabled
- [ ] Security hardening applied
- [ ] Debug endpoint removed (production only)

**Documentation**:
- [ ] App URL documented
- [ ] Deployment credentials saved securely
- [ ] Resource names noted
- [ ] Any customizations documented

---

**Congratulations!** 🎉

You've successfully deployed TCExplorer to Azure App Service. Your application is now live and accessible worldwide.

**Your app**: `https://<APP_NAME>.azurewebsites.net`

---

*This guide was created by Team Sharks to document the complete Azure deployment process for TCExplorer v2.0.0.*

*Last Updated: October 14, 2025*
