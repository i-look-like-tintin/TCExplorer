# TCExplorer Documentation Index

**Complete guide to all project documentation**

This project includes comprehensive documentation for deployment, development, and usage. This index will help you find the right document for your needs.

---

## 📖 Choose Your Document

### 🚀 "I want to deploy TCExplorer to a NEW Azure Web App"
**Read**: [AZURE_DEPLOYMENT_GUIDE.md](AZURE_DEPLOYMENT_GUIDE.md)

**What it contains**:
- Complete step-by-step deployment guide from scratch
- Prerequisites and verification
- Azure resource creation commands
- Deployment process walkthrough
- Troubleshooting for common issues
- Recovery appendices
- Cost estimation

**Time required**: 30-45 minutes for first deployment

---

### 🔄 "I want to RESUME working on the existing Azure deployment"
**Read**: [DEPLOYMENT_CONTEXT.md](DEPLOYMENT_CONTEXT.md)

**What it contains**:
- Complete technical context of current deployment
- Architecture overview and file structure
- All configuration files explained in detail
- Issues encountered and their solutions
- Debug endpoints and verification commands
- Maintenance procedures

**Best for**: Picking up where you left off, understanding current setup

---

### ⚡ "I need QUICK commands for common tasks"
**Read**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**What it contains**:
- Deploy changes (1 command)
- Restart app (1 command)
- Check status (1 command)
- View logs (1 command)
- Health check URLs
- Quick troubleshooting steps
- Monthly maintenance checklist

**Best for**: Daily operations, quick lookups

---

### 📝 "I want to understand WHAT WAS DONE in the deployment session"
**Read**: [SESSION_SUMMARY.md](SESSION_SUMMARY.md)

**What it contains**:
- High-level summary of accomplishments
- Key decisions and their rationale
- Performance metrics
- Testing performed
- Lessons learned
- Next steps and recommendations

**Best for**: Understanding the big picture, explaining to others

---

### 🏗️ "I'm a DEVELOPER working on TCExplorer code"
**Read**: [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)

**What it contains**:
- Architecture overview
- Core classes and their purposes
- Data management system
- Visualization system
- Adding new features
- Development guidelines

**Best for**: Contributing to the codebase, understanding internals

---

### 👥 "I'm an END USER learning to use TCExplorer"
**Read**: [USER_GUIDE.md](USER_GUIDE.md)

**What it contains**:
- Getting started tutorial
- Feature descriptions
- How to use each control
- Interpreting visualizations
- Tips and tricks

**Best for**: Learning to use the application

---

### 📦 "I want to understand the PROJECT as a whole"
**Read**: [README.md](README.md)

**What it contains**:
- Project overview
- Key features
- Data sources
- Installation instructions
- Version history
- Team information

**Best for**: First-time visitors, project overview

---

## 📊 Documentation at a Glance

| Document | Lines | Purpose | Audience |
|----------|-------|---------|----------|
| **AZURE_DEPLOYMENT_GUIDE.md** | ~650 | Step-by-step new deployment | Deployers |
| **DEPLOYMENT_CONTEXT.md** | ~1,050 | Technical context & troubleshooting | Developers/Maintainers |
| **SESSION_SUMMARY.md** | ~440 | High-level deployment summary | Everyone |
| **QUICK_REFERENCE.md** | ~160 | Common commands quick lookup | Daily operators |
| **TECHNICAL_DOCS.md** | ~470 | Development guide | Developers |
| **USER_GUIDE.md** | ~200 | End-user instructions | Users |
| **README.md** | ~210 | Project overview | Everyone |
| **AZURE_DEPLOYMENT.md** | ~500 | Original Azure docs | Reference |

**Total**: ~3,680 lines of documentation

---

## 🎯 Quick Decision Tree

```
START: What do you need?

┌─ Need to deploy to NEW Azure Web App?
│  └─> Read: AZURE_DEPLOYMENT_GUIDE.md
│
┌─ Need to work on EXISTING deployment?
│  └─> Read: DEPLOYMENT_CONTEXT.md
│
┌─ Need a QUICK command?
│  └─> Read: QUICK_REFERENCE.md
│
┌─ Want to understand WHAT WAS DONE?
│  └─> Read: SESSION_SUMMARY.md
│
┌─ Developing NEW FEATURES?
│  └─> Read: TECHNICAL_DOCS.md
│
┌─ Learning to USE the app?
│  └─> Read: USER_GUIDE.md
│
└─ Want PROJECT OVERVIEW?
   └─> Read: README.md
```

---

## 🗂️ Documentation Organization

### Deployment Documentation
```
AZURE_DEPLOYMENT_GUIDE.md     ← New deployment (complete walkthrough)
DEPLOYMENT_CONTEXT.md          ← Existing deployment (technical details)
AZURE_DEPLOYMENT.md            ← Original deployment docs (reference)
SESSION_SUMMARY.md             ← What was accomplished
QUICK_REFERENCE.md             ← Daily operations
```

### Development Documentation
```
TECHNICAL_DOCS.md              ← Architecture & development
README.md                      ← Project overview
LICENSE                        ← GPL-3.0 license
```

### User Documentation
```
USER_GUIDE.md                  ← How to use TCExplorer
README.md                      ← Features overview
```

### Meta Documentation
```
DOCUMENTATION_INDEX.md         ← This file (guide to all docs)
```

---

## 🔍 Search Tips

### Finding Specific Information

**"How do I...?"** → AZURE_DEPLOYMENT_GUIDE.md (Appendices)
- Regenerate cache files → Appendix B
- Estimate costs → Appendix C
- Find Azure CLI commands → Appendix D

**"Why is...?"** → DEPLOYMENT_CONTEXT.md
- PHP memory 1536M? → "Critical Configuration Files"
- .htaccess used instead of web.config? → "Issues Encountered"
- Cache files pre-deployed? → "Data Files Explained"

**"What's the command for...?"** → QUICK_REFERENCE.md
- Deploying changes → "Common Commands"
- Viewing logs → "Common Commands"
- Checking status → "Common Commands"

**"How do I fix...?"** → Both guides have troubleshooting
- QUICK_REFERENCE.md → Quick fixes (3-4 steps)
- AZURE_DEPLOYMENT_GUIDE.md → Detailed troubleshooting
- DEPLOYMENT_CONTEXT.md → Root cause analysis

---

## 📚 Recommended Reading Order

### For First-Time Deployers
1. README.md (5 min) - Understand the project
2. AZURE_DEPLOYMENT_GUIDE.md (30 min) - Follow step-by-step
3. QUICK_REFERENCE.md (2 min) - Bookmark for later
4. DEPLOYMENT_CONTEXT.md (optional) - Deep dive if interested

### For Maintainers
1. SESSION_SUMMARY.md (10 min) - Understand what was done
2. DEPLOYMENT_CONTEXT.md (20 min) - Learn technical details
3. QUICK_REFERENCE.md (2 min) - Daily reference
4. AZURE_DEPLOYMENT_GUIDE.md (reference) - Troubleshooting

### For Developers
1. README.md (5 min) - Project overview
2. TECHNICAL_DOCS.md (30 min) - Architecture & code
3. DEPLOYMENT_CONTEXT.md (15 min) - Deployment details
4. USER_GUIDE.md (10 min) - User perspective

### For New Team Members
1. README.md (5 min) - What is TCExplorer?
2. SESSION_SUMMARY.md (10 min) - Recent work summary
3. USER_GUIDE.md (15 min) - How to use it
4. Choose based on role:
   - Developer → TECHNICAL_DOCS.md
   - DevOps → DEPLOYMENT_CONTEXT.md
   - Manager → SESSION_SUMMARY.md

---

## 🔄 Documentation Updates

### When to Update Each Document

**QUICK_REFERENCE.md**: Update when...
- Commands change
- New common operations added
- Health check URLs change

**DEPLOYMENT_CONTEXT.md**: Update when...
- New issues encountered and solved
- Configuration changes
- Architecture changes
- New Azure resources added

**AZURE_DEPLOYMENT_GUIDE.md**: Update when...
- Deployment process changes
- New prerequisites added
- Troubleshooting sections expanded
- Cost estimates change

**SESSION_SUMMARY.md**: Generally static
- Documents this specific session
- Update if significant follow-up work done

**TECHNICAL_DOCS.md**: Update when...
- New features added
- Architecture changes
- New classes or modules added

---

## ✅ Documentation Checklist

Before considering documentation complete, ensure:

- [ ] All code has corresponding docs
- [ ] All configuration files explained
- [ ] All common issues have troubleshooting steps
- [ ] All commands have examples
- [ ] All prerequisites listed
- [ ] All URLs documented
- [ ] All decisions have rationale
- [ ] Quick reference up to date
- [ ] Index (this file) updated

---

## 🆘 Help & Support

### Can't Find What You Need?

1. **Search all docs**: Use your editor's search
   ```bash
   grep -r "your search term" *.md
   ```

2. **Check the specific document** for your need (see decision tree above)

3. **Common issues**:
   - Deployment problems → AZURE_DEPLOYMENT_GUIDE.md "Troubleshooting"
   - Configuration questions → DEPLOYMENT_CONTEXT.md "Critical Configuration"
   - Quick commands → QUICK_REFERENCE.md
   - Feature questions → USER_GUIDE.md or TECHNICAL_DOCS.md

4. **Still stuck?**:
   - Check Azure logs: `az webapp log tail`
   - Verify debug endpoint: https://tcexplorertest.azurewebsites.net/php/debug.php
   - Review SESSION_SUMMARY.md "Lessons Learned"

---

## 📝 Documentation Standards

All documentation in this project follows these standards:

- **Markdown format**: GitHub-flavored markdown (.md)
- **Structure**: Clear headings, tables, code blocks
- **Examples**: Real commands with expected output
- **Links**: Internal links between related docs
- **Emoji**: Used sparingly for visual scanning
- **Code blocks**: Always with language specified
- **Length**: Comprehensive but scannable

---

## 🎓 Documentation Philosophy

These documents were created with the principle:

> **"Future you (or future developer) should be able to pick this up 6 months from now and understand exactly what to do."**

Every document aims to:
- ✅ Be self-contained (minimal external references)
- ✅ Include examples for every command
- ✅ Explain the "why" not just the "what"
- ✅ Anticipate common questions
- ✅ Provide troubleshooting for known issues
- ✅ Be skimmable (clear headings, tables)
- ✅ Be comprehensive (no assumed knowledge)

---

## 📞 Contact & Credits

**Developed by**: Team Sharks (May, Markey, Scott, Jackson, Wheeler)
**Documentation**: Created during October 14, 2025 deployment session
**Project**: TCExplorer v2.0.0
**License**: GNU General Public License-3.0

For questions about the application itself, see USER_GUIDE.md.
For deployment questions, see AZURE_DEPLOYMENT_GUIDE.md.

---

*This index was created to help navigate the comprehensive TCExplorer documentation suite.*
*Last updated: October 14, 2025*
