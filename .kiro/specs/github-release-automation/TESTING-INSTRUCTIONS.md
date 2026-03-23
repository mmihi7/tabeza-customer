# Testing Instructions for GitHub Release Automation

## Overview

This document provides step-by-step instructions to test the GitHub release automation workflow that has been built. All necessary files have been created in the Tabz repository and need to be transferred to TabezaConnect.

## Current Status

✅ **Completed Components:**
1. GitHub Actions workflow file (`.github/workflows/release.yml`)
2. Validation scripts (PowerShell and Bash)
3. Release notes generator scripts (PowerShell and Bash)
4. Comprehensive testing documentation
5. Automated test script

## Files to Transfer

### From Tabz to TabezaConnect

All files are currently in the Tabz repository and need to be copied to TabezaConnect:

#### 1. Validation Scripts
**Source**: `Tabz/dev-tools/scripts/`
**Destination**: `TabezaConnect/.github/scripts/`

Files:
- `validate-artifact.ps1` (PowerShell validation script)
- `validate-artifact.sh` (Bash validation script)

#### 2. Release Notes Generator Scripts
**Source**: `Tabz/.github/scripts/`
**Destination**: `TabezaConnect/.github/scripts/`

Files:
- `generate-release-notes.ps1` (PowerShell release notes generator)
- `generate-release-notes.sh` (Bash release notes generator)

#### 3. Test Automation Script
**Source**: `Tabz/dev-tools/scripts/`
**Destination**: `TabezaConnect/scripts/`

Files:
- `test-release-workflow.ps1` (Automated test script)

#### 4. Workflow File (Already in Place)
**Location**: `TabezaConnect/.github/workflows/release.yml`
**Status**: ✅ Already exists and is up to date

## Manual Transfer Steps

### Step 1: Create Scripts Directory

```powershell
# Navigate to TabezaConnect
cd C:\Projects\TabezaConnect

# Create .github/scripts directory if it doesn't exist
New-Item -ItemType Directory -Path ".github\scripts" -Force

# Create scripts directory if it doesn't exist
New-Item -ItemType Directory -Path "scripts" -Force
```

### Step 2: Copy Validation Scripts

```powershell
# Copy PowerShell validation script
Copy-Item "C:\Projects\Tabz\dev-tools\scripts\validate-artifact.ps1" `
          "C:\Projects\TabezaConnect\.github\scripts\validate-artifact.ps1"

# Copy Bash validation script
Copy-Item "C:\Projects\Tabz\dev-tools\scripts\validate-artifact.sh" `
          "C:\Projects\TabezaConnect\.github\scripts\validate-artifact.sh"
```

### Step 3: Copy Release Notes Generator Scripts

```powershell
# Copy PowerShell release notes generator
Copy-Item "C:\Projects\Tabz\.github\scripts\generate-release-notes.ps1" `
          "C:\Projects\TabezaConnect\.github\scripts\generate-release-notes.ps1"

# Copy Bash release notes generator
Copy-Item "C:\Projects\Tabz\.github\scripts\generate-release-notes.sh" `
          "C:\Projects\TabezaConnect\.github\scripts\generate-release-notes.sh"
```

### Step 4: Copy Test Automation Script

```powershell
# Copy test automation script
Copy-Item "C:\Projects\Tabz\dev-tools\scripts\test-release-workflow.ps1" `
          "C:\Projects\TabezaConnect\scripts\test-release-workflow.ps1"
```

### Step 5: Verify All Files

```powershell
# Verify all files were copied
cd C:\Projects\TabezaConnect

# Check validation scripts
Test-Path ".github\scripts\validate-artifact.ps1"
Test-Path ".github\scripts\validate-artifact.sh"

# Check release notes scripts
Test-Path ".github\scripts\generate-release-notes.ps1"
Test-Path ".github\scripts\generate-release-notes.sh"

# Check test script
Test-Path "scripts\test-release-workflow.ps1"

# Check workflow file
Test-Path ".github\workflows\release.yml"
```

All commands should return `True`.

## Quick Test Procedure

Once files are transferred, follow these steps:

### Option 1: Automated Test (Recommended)

```powershell
# Navigate to TabezaConnect
cd C:\Projects\TabezaConnect

# Run automated test script
.\scripts\test-release-workflow.ps1
```

The script will:
1. ✅ Run pre-flight checks
2. ✅ Build installer locally
3. ✅ Validate artifact
4. ✅ Create test tag
5. ⏸️ Prompt before pushing tag

### Option 2: Manual Test

Follow the quick checklist in `QUICK-TEST-CHECKLIST.md`:

```powershell
# 1. Clean and build
cd C:\Projects\TabezaConnect
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
npm install
cd src/service && npm install && cd ../..
npm run download:nodejs
$env:VERSION = "1.0.1-test"
npm run build:installer

# 2. Validate
.\.github\scripts\validate-artifact.ps1 -Version "1.0.1-test"

# 3. Create and push tag
git tag -a v1.0.1-test -m "Test release for workflow validation"
git push origin v1.0.1-test

# 4. Monitor workflow
# Open: https://github.com/billoapp/TabezaConnect/actions

# 5. Verify release
# Open: https://github.com/billoapp/TabezaConnect/releases

# 6. Test download
$url = "https://github.com/billoapp/TabezaConnect/releases/download/v1.0.1-test/TabezaConnect-Setup-v1.0.1-test.zip"
Invoke-WebRequest -Uri $url -OutFile "test.zip"
Test-Path "test.zip"

# 7. Cleanup
gh release delete v1.0.1-test --yes
git tag -d v1.0.1-test
git push origin --delete v1.0.1-test
```

## What to Verify

### During Workflow Execution

Monitor GitHub Actions at: `https://github.com/billoapp/TabezaConnect/actions`

Check that all steps complete:
- ✅ Checkout repository
- ✅ Setup Node.js
- ✅ Extract and validate version
- ✅ Update package.json version
- ✅ Install dependencies
- ✅ Download Node.js runtime
- ✅ Build installer package
- ✅ Verify ZIP artifact
- ✅ Validate artifact
- ✅ Upload ZIP as workflow artifact
- ✅ Generate release notes
- ✅ Upload validated ZIP to GitHub release

### After Workflow Completes

1. **Release Created**: Check `https://github.com/billoapp/TabezaConnect/releases`
   - ✅ Release exists with tag `v1.0.1-test`
   - ✅ Marked as "Pre-release"
   - ✅ ZIP file attached
   - ✅ Release notes present

2. **Download URL Works**:
   ```powershell
   $url = "https://github.com/billoapp/TabezaConnect/releases/download/v1.0.1-test/TabezaConnect-Setup-v1.0.1-test.zip"
   Invoke-WebRequest -Uri $url -OutFile "test.zip"
   ```
   - ✅ File downloads successfully
   - ✅ File size 20-50 MB

3. **ZIP Contents Valid**:
   ```powershell
   Expand-Archive -Path "test.zip" -DestinationPath "test-extract"
   Test-Path "test-extract/install.bat"
   Test-Path "test-extract/README.txt"
   Test-Path "test-extract/nodejs/node.exe"
   ```
   - ✅ All required files present

4. **Pre-release NOT in /latest/**:
   ```powershell
   # This should fail (expected behavior)
   $latestUrl = "https://github.com/billoapp/TabezaConnect/releases/latest/download/TabezaConnect-Setup-v1.0.1-test.zip"
   try {
       Invoke-WebRequest -Uri $latestUrl -OutFile "test-latest.zip" -ErrorAction Stop
       Write-Host "❌ FAIL: Pre-release should not be accessible via /latest/"
   } catch {
       Write-Host "✅ PASS: Pre-release correctly not accessible via /latest/"
   }
   ```

## Expected Results

### Success Criteria

All of the following should be true:

- [x] Local build completes without errors
- [x] Validation script passes
- [x] Tag push triggers workflow
- [x] All workflow steps complete successfully
- [x] GitHub release is created
- [x] ZIP file is attached to release
- [x] Release notes are generated
- [x] Download URL works immediately
- [x] Downloaded ZIP contains all required files
- [x] Pre-release NOT accessible via /latest/ URL

### Total Time

- **File Transfer**: ~2 minutes
- **Automated Test**: ~15-20 minutes
- **Manual Verification**: ~5 minutes
- **Cleanup**: ~2 minutes
- **Total**: ~25-30 minutes

## Troubleshooting

### Issue: Scripts directory creation fails

**Solution**: Create manually in File Explorer or use:
```powershell
mkdir "C:\Projects\TabezaConnect\.github\scripts"
mkdir "C:\Projects\TabezaConnect\scripts"
```

### Issue: Workflow doesn't trigger

**Solution**: 
1. Check GitHub Actions is enabled in repository settings
2. Verify tag format matches `v*.*.*`
3. Check workflow file syntax

### Issue: Validation fails

**Solution**:
1. Check build output for errors
2. Verify ZIP file exists in `dist/` directory
3. Check file size is within bounds (20-50 MB)
4. Verify all required files are present

### Issue: Release creation fails

**Solution**:
1. Check GITHUB_TOKEN permissions in repository settings
2. Ensure "Read and write permissions" is enabled for workflows
3. Verify release action version is v1 or later

## Next Steps After Successful Test

1. ✅ Mark task 4.1 as complete
2. ✅ Document any issues encountered
3. ⏭️ Proceed with remaining tasks:
   - Task 5: Enhance release creation step
   - Task 6: Add build reproducibility measures
   - Task 7: Implement failure handling
   - Task 8: Update staff app download links
   - Task 9: Add multi-version support
   - Task 10: Final checkpoint
   - Task 11: Create production release

## Documentation References

- **Detailed Test Guide**: `END-TO-END-TEST-GUIDE.md`
- **Quick Checklist**: `QUICK-TEST-CHECKLIST.md`
- **Automated Script Docs**: `AUTOMATED-TEST-SCRIPT.md`
- **Requirements**: `requirements.md`
- **Design**: `design.md`
- **Tasks**: `tasks.md`

## Summary

The GitHub release automation workflow is complete and ready for testing. All necessary files have been created and documented. Follow the steps above to transfer files and run the test. The automated test script will handle most of the work, requiring only confirmation before pushing the test tag.

**Ready to test!** 🚀
