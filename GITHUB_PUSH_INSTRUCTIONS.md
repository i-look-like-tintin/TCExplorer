# Instructions for Pushing to GitHub

## ✅ Branch Ready: `github-deployment`

All Claude references have been removed and the branch is ready to push to GitHub!

---

## 📊 What's in This Branch

### New Files Added (10 commits)
1. Azure deployment configuration files (.htaccess, .user.ini, startup.sh, etc.)
2. IBTrACS cache files (540MB total - 7 JSON + 1 CSV)
3. PHP debug endpoint
4. Comprehensive documentation (5 new markdown files)

### Documentation Files
- `DEPLOYMENT_CONTEXT.md` - Technical context for existing deployment
- `AZURE_DEPLOYMENT_GUIDE.md` - Step-by-step guide for new deployments
- `SESSION_SUMMARY.md` - Summary of deployment session
- `QUICK_REFERENCE.md` - Common commands reference
- `DOCUMENTATION_INDEX.md` - Navigation guide for all docs

---

## 🚀 Push to GitHub

### Option 1: Push as New Branch (Recommended)

```bash
# Push the github-deployment branch to GitHub
git push origin github-deployment

# Then create a Pull Request on GitHub to merge into main
```

**Why this is recommended:**
- Allows review before merging to main
- Shows the diff clearly
- Can discuss changes with team
- Easy to rollback if needed

### Option 2: Merge Locally and Push

```bash
# Switch to main
git checkout main

# Merge github-deployment into main
git merge github-deployment

# Push to GitHub
git push origin main

# Optionally delete the branch
git branch -d github-deployment
git push origin --delete github-deployment
```

---

## ⚠️ Important: Large Files

**GitHub has a 100MB file size limit!**

Your branch includes:
- `php/cache/ibtracs/ibtracs_all.csv` (314MB) ❌ Too large!
- `php/cache/ibtracs/parsed_all_western_pacific.json` (72MB) ✅ OK
- Other files are smaller ✅ OK

### Solution: Use Git LFS or Remove Large Files

#### Option A: Use Git LFS (Recommended)

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "php/cache/ibtracs/ibtracs_all.csv"
git lfs track "php/cache/ibtracs/*.json"

# Add .gitattributes
git add .gitattributes

# Commit
git commit -m "Add Git LFS tracking for large cache files"

# Push (will upload to LFS)
git push origin github-deployment
```

**Note**: Git LFS is free for public repos, has bandwidth limits for private repos.

#### Option B: Remove CSV from GitHub (Keep JSON only)

```bash
# Remove the 314MB CSV
git rm --cached php/cache/ibtracs/ibtracs_all.csv

# Update .gitignore to exclude it
echo "php/cache/ibtracs/ibtracs_all.csv" >> .gitignore

# Commit
git add .gitignore
git commit -m "Remove large CSV file from Git tracking (too large for GitHub)"

# Push
git push origin github-deployment
```

**Trade-off**: CSV won't be in GitHub, but:
- JSON files (pre-parsed) are there
- CSV can be downloaded from NOAA when needed
- Azure deployment already has the CSV

#### Option C: Use GitHub Releases

1. Push branch without CSV
2. Upload CSV as a release asset
3. Download CSV when deploying

---

## 🔍 Verify Before Pushing

```bash
# Check file sizes
git ls-files -z | xargs -0 du -h | sort -h | tail -20

# Check for Claude references (should be none)
git log --all --format="%B" | grep -i claude

# Check documentation
grep -r -i "claude" *.md
```

---

## 📋 Post-Push Checklist

After pushing to GitHub:

- [ ] Verify branch appears on GitHub
- [ ] Check all files uploaded successfully
- [ ] Review documentation renders correctly on GitHub
- [ ] Create Pull Request (if using Option 1)
- [ ] Update README.md if needed (links, badges, etc.)
- [ ] Tag release if this is v2.0.0 deployment update

---

## 🔄 Syncing GitHub and Azure

You now have two remotes:

- **origin/github**: Your GitHub repository
- **azure**: Your Azure Web App

### To keep them in sync:

```bash
# Push to both
git push origin github-deployment  # or main
git push azure main:master

# Or set up both as tracking branches
git branch --set-upstream-to=origin/main main
```

---

## 💡 Recommendation

**Best approach for this situation:**

1. **Use Git LFS** for the large CSV file
2. **Push as a new branch** to GitHub
3. **Create a Pull Request** for review
4. **Merge after review**
5. **Tag as v2.0.1** (Azure deployment update)

This maintains clean history and allows for review before merging to main.

---

## 🆘 If Push Fails

### Error: File too large
```
remote: error: File php/cache/ibtracs/ibtracs_all.csv is 314.00 MB; this exceeds GitHub's file size limit of 100.00 MB
```

**Solution**: Use Git LFS (Option A above) or remove CSV (Option B above)

### Error: Push rejected (non-fast-forward)
```bash
# Fetch latest changes first
git fetch origin

# Then either rebase or merge
git rebase origin/main
# or
git merge origin/main

# Then push
git push origin github-deployment
```

---

## 📞 Support

- **Git LFS Docs**: https://git-lfs.github.com/
- **GitHub Large Files**: https://docs.github.com/en/repositories/working-with-files/managing-large-files
- **Git Basics**: https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control

---

*Prepared for TCExplorer v2.0.0 Azure deployment branch*
*Ready to push to: https://github.com/i-look-like-tintin/TCExplorer*
