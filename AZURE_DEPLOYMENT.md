# Azure Deployment Guide for TC Explorer

This guide provides step-by-step instructions for deploying TC Explorer to Azure App Service.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Deployment Steps](#detailed-deployment-steps)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- **Azure Account**: Active Azure subscription ([Create free account](https://azure.microsoft.com/free/))
- **Azure CLI**: Installed on your machine ([Installation guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- **Git**: Installed and configured
- **Project Files**: All deployment files are already included in this repository

### Required Files (Already Included)
- `web.config` - IIS configuration for PHP on Azure
- `composer.json` - PHP runtime detection
- `.deployment` - Azure deployment configuration

---

## Quick Start

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub** (if not already done)
2. **Create Azure Web App**:
   ```bash
   az login
   az webapp up --name your-app-name --resource-group your-rg-name --runtime "PHP:8.0"
   ```

3. **Configure GitHub Deployment**:
   - Go to Azure Portal → Your App Service → Deployment Center
   - Select GitHub as source
   - Authorize and select your repository and branch
   - Azure will automatically deploy on push

### Option 2: Deploy via Azure CLI (Direct)

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name tcexplorer-rg --location australiaeast

# Create App Service plan
az appservice plan create --name tcexplorer-plan --resource-group tcexplorer-rg --sku B1 --is-linux

# Create Web App with PHP 8.0
az webapp create --name your-unique-app-name --resource-group tcexplorer-rg --plan tcexplorer-plan --runtime "PHP:8.0"

# Deploy from local Git
az webapp deployment source config-local-git --name your-unique-app-name --resource-group tcexplorer-rg

# Get deployment credentials
az webapp deployment list-publishing-credentials --name your-unique-app-name --resource-group tcexplorer-rg

# Add Azure remote and push
git remote add azure <git-url-from-above>
git push azure main
```

---

## Detailed Deployment Steps

### Step 1: Create Azure Resources

#### Using Azure Portal

1. **Navigate to Azure Portal**: https://portal.azure.com
2. **Create App Service**:
   - Click "Create a resource"
   - Select "Web App"
   - Fill in the details:
     - **Subscription**: Your subscription
     - **Resource Group**: Create new or use existing (e.g., `tcexplorer-rg`)
     - **Name**: Unique name (e.g., `tcexplorer-test-2025`)
     - **Publish**: Code
     - **Runtime stack**: PHP 8.0
     - **Operating System**: Linux (recommended) or Windows
     - **Region**: Australia East (or your preferred region)
     - **App Service Plan**: Create new or use existing (B1 or higher recommended)
   - Click "Review + Create" then "Create"

#### Using Azure CLI

```bash
# Set variables
RESOURCE_GROUP="tcexplorer-rg"
APP_NAME="tcexplorer-test-2025"
LOCATION="australiaeast"
PLAN_NAME="tcexplorer-plan"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan (B1 Basic tier)
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "PHP:8.0"
```

### Step 2: Configure App Settings

Set essential environment variables:

```bash
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings \
  WEBSITE_TIME_ZONE="AUS Eastern Standard Time" \
  PHP_MEMORY_LIMIT="1G" \
  PHP_MAX_EXECUTION_TIME="300" \
  WEBSITE_HTTPLOGGING_RETENTION_DAYS="7"
```

Or via Azure Portal:
1. Go to your App Service → Configuration → Application settings
2. Add the following settings:
   - `WEBSITE_TIME_ZONE`: `AUS Eastern Standard Time`
   - `PHP_MEMORY_LIMIT`: `1G`
   - `PHP_MAX_EXECUTION_TIME`: `300`
   - `WEBSITE_HTTPLOGGING_RETENTION_DAYS`: `7`

### Step 3: Deploy Code

#### Method A: GitHub Actions (Continuous Deployment)

1. **In Azure Portal**:
   - Navigate to your App Service
   - Go to "Deployment Center"
   - Select "GitHub" as source
   - Authorize Azure to access your GitHub account
   - Select your repository and branch (usually `main`)
   - Click "Save"

2. **GitHub Actions workflow** will be automatically created
3. **Every push** to the selected branch will trigger a deployment

#### Method B: Local Git Deployment

```bash
# Get Git credentials
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# This returns a Git URL like:
# https://<deployment-user>@<app-name>.scm.azurewebsites.net/<app-name>.git

# Add Azure as a remote
git remote add azure <git-url-from-above>

# Push to Azure
git push azure main
```

#### Method C: ZIP Deployment

```bash
# Create a zip file (exclude .git, node_modules, etc.)
zip -r tcexplorer.zip . -x "*.git*" "*node_modules*" "*.DS_Store"

# Deploy zip file
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src tcexplorer.zip
```

### Step 4: Enable Required Features

```bash
# Enable detailed error messages (for troubleshooting)
az webapp config set --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --detailed-error-logging-enabled true \
  --http-logging-enabled true

# Set PHP version (if needed)
az webapp config set --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --linux-fx-version "PHP|8.0"
```

---

## Post-Deployment Configuration

### 1. Create Required Directories

Azure App Service has specific writable directories. The app is configured to use:
- **Cache**: `D:/home/data/cache/` (persistent storage)
- **Logs**: `D:/home/LogFiles/application/` (built-in log directory)

These directories are automatically created, but you can verify:

```bash
# Use Azure CLI to run commands
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP

# Once in SSH:
mkdir -p /home/data/cache
mkdir -p /home/data/cache/dp4df
mkdir -p /home/data/cache/ibtracs
chmod -R 775 /home/data/cache
```

### 2. Verify PHP Configuration

Check that PHP is correctly configured:

```bash
# View current PHP configuration
az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP

# Test PHP info (temporary)
# Create a phpinfo.php file in the root, then remove after testing
```

### 3. Configure CORS (Already Handled)

The `web.config` file includes CORS headers, but you can also configure via Azure:

```bash
az webapp cors add --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --allowed-origins "*"
```

### 4. Set up Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname your-domain.com

# Enable HTTPS
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **Application Not Loading**

**Check Application Logs:**
```bash
# Stream logs in real-time
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Or download logs
az webapp log download --name $APP_NAME --resource-group $RESOURCE_GROUP
```

**Via Portal:**
- Go to App Service → Monitoring → Log stream
- Or: Diagnose and solve problems → Application Logs

#### 2. **PHP Errors / 500 Internal Server Error**

**Enable detailed error messages:**
- Edit `web.config` temporarily to show detailed errors:
  ```xml
  <httpErrors errorMode="Detailed" />
  ```
- Check PHP error logs at: `D:/home/LogFiles/application/`

**Common causes:**
- Missing PHP extensions
- File permission issues
- Incorrect file paths
- Memory limit exceeded

#### 3. **Data Not Loading from External APIs**

**Check outbound connectivity:**
```bash
# Test from SSH console
curl -I https://climate.mri-jma.go.jp/pub/d4pdf/tropical_cyclone_tracks/
curl -I https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/
```

**Verify cache directory permissions:**
```bash
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
ls -la /home/data/cache
```

#### 4. **Cache Issues**

**Clear cache manually:**
```bash
# Via SSH
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
rm -rf /home/data/cache/*
```

**Or restart the app:**
```bash
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

#### 5. **Memory Limit Exceeded**

**Increase PHP memory limit:**
```bash
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --settings PHP_MEMORY_LIMIT="1536M"
```

**Or upgrade App Service plan:**
```bash
az appservice plan update --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku B2
```

---

## Monitoring and Maintenance

### Application Insights (Recommended)

Enable Application Insights for advanced monitoring:

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app tcexplorer-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Link to Web App
az monitor app-insights component connect-webapp \
  --app tcexplorer-insights \
  --resource-group $RESOURCE_GROUP \
  --web-app $APP_NAME
```

### Regular Maintenance Tasks

#### 1. Monitor Logs
```bash
# Stream application logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
```

#### 2. Clear Old Cache Files
Set up a scheduled task or manually clear cache periodically:
```bash
# Via Azure CLI
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
# Then: find /home/data/cache -type f -mtime +30 -delete
```

#### 3. Update PHP Version
```bash
# Check available PHP versions
az webapp list-runtimes --os linux

# Update runtime
az webapp config set --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --linux-fx-version "PHP|8.1"
```

#### 4. Backup Configuration
```bash
# Create backup
az webapp config backup create \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $APP_NAME \
  --backup-name tcexplorer-backup-$(date +%Y%m%d) \
  --container-url "<storage-container-sas-url>"
```

### Performance Optimization

#### Enable Always On (Prevents cold starts)
```bash
az webapp config set --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --always-on true
```

#### Scale Up (Vertical Scaling)
```bash
# Upgrade to higher tier for more resources
az appservice plan update --name $PLAN_NAME --resource-group $RESOURCE_GROUP \
  --sku S1  # Standard tier
```

#### Scale Out (Horizontal Scaling)
```bash
# Add more instances
az appservice plan update --name $PLAN_NAME --resource-group $RESOURCE_GROUP \
  --number-of-workers 2
```

---

## Environment Variables Reference

These environment variables are automatically set by Azure:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `WEBSITE_SITE_NAME` | Your app name | `tcexplorer-test-2025` |
| `HOME` | Home directory | `/home` |
| `WEBSITE_HOSTNAME` | App hostname | `tcexplorer-test-2025.azurewebsites.net` |

Custom variables you may want to set:

| Variable | Purpose | Recommended Value |
|----------|---------|-------------------|
| `PHP_MEMORY_LIMIT` | PHP memory limit | `1G` or `1536M` |
| `PHP_MAX_EXECUTION_TIME` | Script timeout | `300` (5 minutes) |
| `WEBSITE_TIME_ZONE` | Time zone | `AUS Eastern Standard Time` |

---

## Security Best Practices

1. **Enable HTTPS Only**:
   ```bash
   az webapp update --name $APP_NAME --resource-group $RESOURCE_GROUP --https-only true
   ```

2. **Restrict FTP Access**:
   - Go to App Service → Configuration → General settings
   - Set FTP state to "FTPS Only" or "Disabled"

3. **Enable Managed Identity** (for future database access):
   ```bash
   az webapp identity assign --name $APP_NAME --resource-group $RESOURCE_GROUP
   ```

4. **Regular Updates**:
   - Keep PHP version updated
   - Monitor security advisories
   - Update dependencies regularly

---

## Useful Azure CLI Commands

```bash
# View app details
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Stop app
az webapp stop --name $APP_NAME --resource-group $RESOURCE_GROUP

# Start app
az webapp start --name $APP_NAME --resource-group $RESOURCE_GROUP

# Delete app (be careful!)
az webapp delete --name $APP_NAME --resource-group $RESOURCE_GROUP

# View all apps in resource group
az webapp list --resource-group $RESOURCE_GROUP --output table
```

---

## Cost Optimization

- **Basic Tier (B1)**: ~$13-15 USD/month (sufficient for testing)
- **Standard Tier (S1)**: ~$70 USD/month (production with always-on)
- **Free Tier (F1)**: Available but limited (60 min/day runtime)

**Tips:**
- Stop apps when not in use during testing
- Use deployment slots for staging (S1+ required)
- Monitor usage with Azure Cost Management

---

## Support and Resources

- **Azure Documentation**: https://docs.microsoft.com/azure/app-service/
- **PHP on Azure**: https://docs.microsoft.com/azure/app-service/configure-language-php
- **Azure CLI Reference**: https://docs.microsoft.com/cli/azure/webapp
- **TC Explorer GitHub**: (Your repository URL)
- **Team Sharks**: Contact via project repository

---

## Quick Reference Commands

```bash
# Deploy from Git
git push azure main

# View logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# SSH into app
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP

# Check app status
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query state
```

---

**Deployed by Team Sharks: May, Markey, Scott, Jackson, and Wheeler**

*TC Explorer v2.0.0 - Azure Deployment Guide*
