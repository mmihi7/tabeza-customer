# Task 2.4 Completion Notes

## Task: Add validation step to workflow

**Status**: ✅ Completed in Tabz repository (needs transfer to TabezaConnect)

## Changes Made

### 1. Updated Workflow File
**File**: `.github/workflows/release.yml` (in Tabz repository)

Added validation step after build and before release creation:

```yaml
- name: Validate artifact
  shell: pwsh
  run: |
    # Requirements: 7.4 - Call validation script after build step
    Write-Host "Running artifact validation..."
    
    # Run PowerShell validation script
    .\.github\scripts\validate-artifact.ps1 -Version $env:VERSION -DistPath "dist"
    
    if ($LASTEXITCODE -ne 0) {
      Write-Host "❌ Artifact validation failed" -ForegroundColor Red
      exit 1
    }
    
    Write-Host "✅ Artifact validation passed" -ForegroundColor Green
```

### 2. Workflow Flow
The complete workflow now follows this sequence:

1. **Build installer package** - Creates the ZIP file
2. **Verify ZIP artifact** - Basic existence and filename check
3. **Validate artifact** ⭐ NEW - Comprehensive validation using script
4. **Upload ZIP as workflow artifact** - Store for GitHub Actions
5. **Create Release** - Publish to GitHub releases

### 3. Validation Checks Performed

The validation step calls `validate-artifact.ps1` which performs:

- ✅ ZIP file exists at expected path
- ✅ Filename matches pattern: `TabezaConnect-Setup-v{version}.zip`
- ✅ Version in filename matches tag version
- ✅ File size is within bounds (20-50 MB)
- ✅ ZIP integrity test (can be extracted)
- ✅ Required files present:
  - install.bat
  - README.txt
  - nodejs/ directory

### 4. Error Handling

- If validation fails, the workflow stops immediately
- Error messages are output to workflow logs
- No release is created if validation fails
- Exit code 1 ensures GitHub Actions marks the step as failed

## Requirements Satisfied

- ✅ **Requirement 7.4**: Abort and report specific validation errors when validation fails
- ✅ **Requirement 7.1**: Verify ZIP file was created successfully
- ✅ **Requirement 7.2**: Verify ZIP file size is within expected bounds
- ✅ **Requirement 7.3**: Verify required files exist in the ZIP
- ✅ **Requirement 4.2**: Use extracted version in ZIP filename validation

## Transfer Instructions

### Files to Transfer to TabezaConnect Repository

1. **Validation Scripts** (from Task 2.1):
   - Source: `Tabz/dev-tools/scripts/validate-artifact.ps1`
   - Source: `Tabz/dev-tools/scripts/validate-artifact.sh`
   - Destination: `TabezaConnect/.github/scripts/`

2. **Workflow File** (updated in this task):
   - Source: `Tabz/.github/workflows/release.yml`
   - Destination: `TabezaConnect/.github/workflows/release.yml`

### Transfer Commands

```powershell
# Create scripts directory in TabezaConnect
mkdir C:\Projects\TabezaConnect\.github\scripts -Force

# Copy validation scripts
Copy-Item "C:\Projects\Tabz\dev-tools\scripts\validate-artifact.ps1" `
          "C:\Projects\TabezaConnect\.github\scripts\validate-artifact.ps1"

Copy-Item "C:\Projects\Tabz\dev-tools\scripts\validate-artifact.sh" `
          "C:\Projects\TabezaConnect\.github\scripts\validate-artifact.sh"

# Copy workflow file
Copy-Item "C:\Projects\Tabz\.github\workflows\release.yml" `
          "C:\Projects\TabezaConnect\.github\workflows\release.yml"
```

### Verification Steps

After transfer, verify in TabezaConnect repository:

1. Check files exist:
   ```powershell
   Test-Path "C:\Projects\TabezaConnect\.github\scripts\validate-artifact.ps1"
   Test-Path "C:\Projects\TabezaConnect\.github\scripts\validate-artifact.sh"
   Test-Path "C:\Projects\TabezaConnect\.github\workflows\release.yml"
   ```

2. Test validation script locally:
   ```powershell
   cd C:\Projects\TabezaConnect
   .\.github\scripts\validate-artifact.ps1 -Version "1.0.0" -DistPath "dist"
   ```

3. Commit and push to TabezaConnect:
   ```powershell
   cd C:\Projects\TabezaConnect
   git add .github/scripts/validate-artifact.ps1
   git add .github/scripts/validate-artifact.sh
   git add .github/workflows/release.yml
   git commit -m "Add artifact validation to release workflow (Task 2.4)"
   git push origin main
   ```

## Testing Plan

### Local Testing
1. Build installer in TabezaConnect: `npm run build:installer`
2. Run validation script: `.\.github\scripts\validate-artifact.ps1 -Version "1.0.0"`
3. Verify all checks pass

### Workflow Testing
1. Push a test tag to TabezaConnect: `git tag v1.0.1-test && git push origin v1.0.1-test`
2. Monitor workflow execution in GitHub Actions
3. Verify validation step runs and passes
4. Verify release is created only after validation passes
5. Test failure scenario by corrupting a ZIP file

## Design Decisions

### Why PowerShell for Validation?
- Windows-native on GitHub Actions Windows runners
- Better error handling and output formatting
- Consistent with Windows-focused TabezaConnect project
- Bash version also provided for cross-platform compatibility

### Why Validate After Build?
- Ensures artifact quality before release
- Prevents publishing broken installers
- Catches issues early in the pipeline
- Provides detailed error messages for debugging

### Why Not Download Artifact?
- ZIP file already exists in `dist/` from build step
- No need to upload and re-download
- Faster execution
- Simpler workflow

## Next Steps

1. ✅ Task 2.4 completed in Tabz repository
2. ⏭️ Transfer files to TabezaConnect repository
3. ⏭️ Test validation in TabezaConnect workflow
4. ⏭️ Move to Task 2.5: Upload validated ZIP to GitHub release

## Notes

- The validation step uses PowerShell (`shell: pwsh`) for consistency with Windows environment
- The `$env:VERSION` variable is set in the "Extract and validate version" step
- The validation script exits with code 1 on failure, which fails the workflow
- All validation output is logged to GitHub Actions for debugging
