# TCExplorer Azure - Quick Reference Card

**Current Deployment**: https://tcexplorertest.azurewebsites.net
**Resource Group**: `tcexplorertest-rg`
**App Name**: `TCExplorerTest`

---

## 🚀 Common Commands

### Deploy Changes
```bash
git add .
git commit -m "Your change description"
git push azure main:master
```

### Restart App
```bash
az webapp restart --name TCExplorerTest --resource-group tcexplorertest-rg
```

### View Logs
```bash
# Stream live
az webapp log tail --name TCExplorerTest --resource-group tcexplorertest-rg

# Download all
az webapp log download --name TCExplorerTest --resource-group tcexplorertest-rg
```

### Check Status
```bash
# App status
az webapp show --name TCExplorerTest --resource-group tcexplorertest-rg --query "state"

# PHP config
curl -s https://tcexplorertest.azurewebsites.net/php/debug.php | jq
```

### SSH Access
```bash
az webapp ssh --name TCExplorerTest --resource-group tcexplorertest-rg
```

---

## 🔍 Quick Health Check

Visit these URLs to verify everything works:

1. **Main App**: https://tcexplorertest.azurewebsites.net
2. **API Test**: https://tcexplorertest.azurewebsites.net/php/api.php?action=test
3. **Debug Info**: https://tcexplorertest.azurewebsites.net/php/debug.php
4. **IBTrACS API**: https://tcexplorertest.azurewebsites.net/php/api.php?action=getRealHistoricalData&basin=all&region=australian

Expected PHP Settings (from debug endpoint):
- `memory_limit`: **1536M** (not 128M)
- `max_execution_time`: **300** (not 30)

---

## 🐛 Quick Troubleshooting

### 502 Error on Data Loading
```bash
# Check PHP settings
curl https://tcexplorertest.azurewebsites.net/php/debug.php | jq '.memory_limit, .max_execution_time'

# If still 128M/30, restart:
az webapp restart --name TCExplorerTest --resource-group tcexplorertest-rg
```

### Deployment Failed
```bash
# Check deployment status
az webapp deployment list --name TCExplorerTest --resource-group tcexplorertest-rg

# Force redeploy
git push azure main:master --force
```

### Changes Not Showing
```bash
# Clear browser cache: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
# Then restart app:
az webapp restart --name TCExplorerTest --resource-group tcexplorertest-rg
```

---

## 📊 Monthly Maintenance

**Recommended once per month:**

1. Update IBTrACS data (if new data available)
2. Check application logs for errors
3. Review performance metrics
4. Test all features (simulated + real data, all regions)

---

## 📁 Important Files

| File | Purpose | Critical? |
|------|---------|-----------|
| `.user.ini` | PHP memory/timeout settings | ✅ Yes |
| `php/config.php` | Azure path detection | ✅ Yes |
| `.htaccess` | Apache configuration | ✅ Yes |
| `startup.sh` | Directory initialization | ✅ Yes |
| `.deployment` | Disable Oryx build | ✅ Yes |
| `composer.json` | PHP runtime detection | ✅ Yes |

**DO NOT delete or modify these files without understanding their purpose!**

---

## 💰 Current Costs

- **Plan**: Basic B1
- **Cost**: ~$13-15 USD/month
- **Bandwidth**: Free (under 100GB/month)
- **Total**: ~$15/month

To check current costs:
```bash
# View cost analysis in portal
az portal cost-management
# Or visit: https://portal.azure.com → Cost Management + Billing
```

---

## 🆘 Emergency Contacts

- **Azure Service Status**: https://status.azure.com
- **Azure Support Portal**: https://portal.azure.com → Help + support
- **Documentation**: See DEPLOYMENT_CONTEXT.md and AZURE_DEPLOYMENT_GUIDE.md

---

## 📖 Full Documentation

- **DEPLOYMENT_CONTEXT.md** - Complete deployment history and context
- **AZURE_DEPLOYMENT_GUIDE.md** - Step-by-step guide for new deployments
- **AZURE_DEPLOYMENT.md** - Original deployment documentation
- **TECHNICAL_DOCS.md** - Developer documentation
- **README.md** - Project overview
- **USER_GUIDE.md** - End-user guide

---

*Quick reference for TCExplorer v2.0.0 Azure deployment*
*Last updated: October 14, 2025*
