Azure Web App Creation Steps (Azure Portal)

  Part 1: Create Web App

  1. Go to Azure Portal: https://portal.azure.com
  2. Create Web App:
    - Click "Create a resource"
    - Search for "Web App"
    - Click "Create"
  3. Basics Tab:
    - Subscription: Your subscription
    - Resource Group: Use existing tcexplorertest-rg (or create new)
    - Name: TCExplorerGH (or your choice - must be globally unique)
    - Publish: Code
    - Runtime stack: PHP 8.1
    - Operating System: Linux
    - Region: Australia East (or your preference)
    - Linux Plan: Use existing tcexplorer-plan (B1 Basic) or create new
  4. Deployment Tab:
    - GitHub Actions settings: Enable
    - GitHub account: Sign in to your GitHub account
    - Organization: i-look-like-tintin
    - Repository: TCExplorer
    - Branch: github-deploy-no-cache
  5. Review + Create:
    - Review settings
    - Click "Create"
    - Wait for deployment to complete (~2-3 minutes)

  ---
  Part 2: Configure App Settings

  After the app is created:

  1. Go to your Web App (TCExplorerGH)
  2. Configuration (left menu):
    - Click "General settings" tab
    - Startup Command: Enter startup.sh
    - Click "Save" at the top
  3. Application Settings (still in Configuration):
    - Click "+ New application setting"
    - Add these settings:

  | Name                           | Value |
  |--------------------------------|-------|
  | SCM_DO_BUILD_DURING_DEPLOYMENT | false |
  | ENABLE_ORYX_BUILD              | false |

    - Click "Save" at the top

  ---
  Part 3: Verify Deployment

  1. Deployment Center (left menu):
    - Check that GitHub Actions deployment is running
    - View logs to see progress
    - Wait for "Success" status
  2. Browse:
    - Click "Browse" at the top (or visit https://tcexplorergh.azurewebsites.net)
    - App should load (may take 30-60 seconds on first visit)

  ---
  Part 4: Test Configuration

  Once deployed, verify PHP configuration is correct:

  1. Check debug endpoint:
  https://tcexplorergh.azurewebsites.net/php/debug.php

  1. Look for:
    - "memory_limit": "1536M" ✅
    - "max_execution_time": "300" ✅
    - "php_version": "8.1.x" ✅
  2. Test IBTrACS download:
    - In the app, select "Real Historical (BoM/IBTrACS)"
    - Choose "Australian" region
    - Click "Load Data"
    - First load will:
        - Download 314MB CSV from NOAA (~30-60 seconds)
      - Parse the CSV (~30-60 seconds)
      - Save parsed JSON to cache
      - Display data
    - Second load should be fast (~1-2 seconds from cache)

  ---
  What to Watch For

  ✅ Success Indicators:

  - Debug endpoint shows memory_limit: 1536M and max_execution_time: 300
  - IBTrACS data loads without 502 errors
  - Cache directory is writable
  - Subsequent loads are fast (using cached JSON)

  ⚠️ Potential Issues:

  If memory_limit is still 128M:
  - .user.ini may not be applied
  - Try: Restart the app (Overview → Restart)
  - Azure sometimes needs a restart after first deployment

  If getting 502 errors when loading data:
  - Memory limit too low OR timeout too short
  - Check error logs: Monitoring → Log stream

  If download fails:
  - Outbound connectivity issue
  - Check that app can reach www.ncei.noaa.gov

  ---
  Comparison Points

  This GitHub deployment test will show whether:

  1. .user.ini works from GitHub deployment (vs local git push)
  2. Apache configuration (.htaccess) applies correctly
  3. Startup script creates cache directories
  4. App can download large files from NOAA
  5. PHP has enough memory/timeout to parse 314MB CSV
  6. Cache persistence works across restarts

  If all works, you can deploy all future updates via GitHub rather than local git push
