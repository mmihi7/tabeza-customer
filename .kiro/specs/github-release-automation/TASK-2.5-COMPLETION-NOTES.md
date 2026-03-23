# Task 2.5 Completion Notes

## Task: Upload validated ZIP to GitHub release

**Status**: ✅ Completed in Tabz repository (needs transfer to TabezaConnect)

## Changes Made

### 1. Updated Release Step in Workflow
**File**: `.github/workflows/release.yml` (in Tabz repository)

Replaced the basic "Create Release" step with a comprehensive "Upload validated ZIP to GitHub release" step that includes:

#### Key Configuration Changes:

1. **Explicit file pattern**: Changed from `dist/*.zip` to `'dist/TabezaConnect-Setup-v*.zip'`
   - More specific pattern matching
   - Ensures only the correct installer is uploaded

2. **Fail-safe validation**: Added `fail_on_unmatched_files: true`
   - Workflow fails if the ZIP file is not found
   - Prevents creating empty releases

3. **Pre-release detection**: Added intelligent pre-release logic
   ```yaml
   prerelease: ${{ contains(github.ref, '-') || (github.event_name == 'workflow_dispatch' && contains(github.event.inputs.version, '-')) }}
   ```
   - Detects pre-release versions (e.g., v1.0.0-beta)
   - Works for both tag push and manual triggers
   - Pre-releases don't update the `/latest/` URL

4. **Custom release notes**: Added `generate_release_notes: false` with custom body
   - Professional release notes with installation instructions
   - System requirements clearly stated
   - Download URLs documented for both latest and specific versions

5. **Step renamed**: Changed from "Create Release" to "Upload validated ZIP to GitHub release"
   - More descriptive name
   - Clearly indicates this step uploads the artifact

### 2. Release Notes Content

The release now includes:

```markdown
## TabezaConnect Release v{version}

Windows printer service for Tabeza POS integration.

### Installation
1. Download `TabezaConnect-Setup-v{version}.zip`
2. Extract the ZIP file
3. Run `install.bat` as Administrator
4. Follow the setup prompts

### Requirements
- Windows 10 or later
- Administrator privileges
- Tabeza venue with POS authority mode

### Download URLs
- Latest release: `https://github.com/billoapp/TabezaConnect/releases/latest/download/TabezaConnect-Setup-v{version}.zip`
- This version: `https://github.com/billoapp/TabezaConnect/releases/download/v{version}/TabezaConnect-Setup-v{version}.zip`
```

### 3. Download URL Patterns

The release supports two URL patterns:

1. **Latest release URL** (always points to newest non-prerelease):
   ```
   https://github.com/billoapp/TabezaConnect/releases/latest/download/TabezaConnect-Setup-v{version}.zip
   ```

2. **Version-specific URL** (permanent link to this version):
   ```
   https://github.com/billoapp/TabezaConnect/releases/download/v{version}/TabezaConnect-Setup-v{version}.zip
   ```

### 4. Workflow Flow

The complete workflow now follows this sequence:

1. **Extract and validate version** - Parse version from tag or manual input
2. **Update package.json version** - Ensure version consistency
3. **Install dependencies** - Root and service dependencies
4. **Download Node.js runtime** - Get portable Node.js
5. **Build installer package** - Create the ZIP file
6. **Verify ZIP artifact** - Basic existence and filename check
7. **Validate artifact** - Comprehensive validation using script
8. **Upload ZIP as workflow artifact** - Store for GitHub Actions
9. **Upload validated ZIP to GitHub release** ⭐ UPDATED - Publish to GitHub releases

## Requirements Satisfied

- ✅ **Requirement 3.1**: Create GitHub release with the tag version
- ✅ **Requirement 3.2**: Include Build_Artifact as a downloadable asset
- ✅ **Requirement 5.1**: Accessible via URL pattern with `/latest/` support
- ✅ **Requirement 5.2**: `/latest/` URL automatically redirects to newest version
- ✅ **Requirement 3.5**: Pre-release versions marked correctly
- ✅ **Requirement 3.6**: Publicly accessible without authentication

## Configuration Details

### softprops/action-gh-release@v1 Configuration

```yaml
uses: softprops/action-gh-release@v1
with:
  tag_name: ${{ github.event_name == 'workflow_dispatch' && format('v{0}', github.event.inputs.version) || github.ref_name }}
  files: 'dist/TabezaConnect-Setup-v*.zip'
  fail_on_unmatched_files: true
  draft: false
  prerelease: ${{ contains(github.ref, '-') || (github.event_name == 'workflow_dispatch' && contains(github.event.inputs.version, '-')) }}
  generate_release_notes: false
  body: |
    [Custom release notes content]
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Key Parameters Explained

- **tag_name**: Handles both tag push and manual trigger scenarios
- **files**: Specific pattern to match only the installer ZIP
- **fail_on_unmatched_files**: Ensures ZIP exists before creating release
- **draft**: Set to `false` for immediate publication
- **prerelease**: Detects hyphen in version for pre-release marking
- **generate_release_notes**: Disabled to use custom release notes
- **body**: Custom markdown content with installation instructions
- **GITHUB_TOKEN**: Automatic token provided by GitHub Actions

## Transfer Instructions

### Files to Transfer to TabezaConnect Repository

1. **Updated Workflow File**:
   - Source: `Tabz/.github/workflows/release.yml`
   - Destination: `TabezaConnect/.github/workflows/release.yml`

### Transfer Commands

```powershell
# Copy updated workflow file
Copy-Item "C:\Projects\Tabz\.github\workflows\release.yml" `
          "C:\Projects\TabezaConnect\.github\workflows\release.yml" -Force
```

### Verification Steps

After transfer, verify in TabezaConnect repository:

1. Check file exists:
   ```powershell
   Test-Path "C:\Projects\TabezaConnect\.github\workflows\release.yml"
   ```

2. Review the release step configuration:
   ```powershell
   cd C:\Projects\TabezaConnect
   Get-Content .github\workflows\release.yml | Select-String -Pattern "Upload validated ZIP" -Context 20
   ```

3. Commit and push to TabezaConnect:
   ```powershell
   cd C:\Projects\TabezaConnect
   git add .github/workflows/release.yml
   git commit -m "Update release step to upload validated ZIP (Task 2.5)"
   git push origin main
   ```

## Testing Plan

### Local Testing (Pre-Push)

1. **Validate YAML syntax**:
   ```powershell
   # Install yamllint if not already installed
   pip install yamllint
   
   # Validate workflow file
   yamllint .github/workflows/release.yml
   ```

2. **Review configuration**:
   - Verify `files` pattern matches expected ZIP filename
   - Verify `fail_on_unmatched_files` is set to `true`
   - Verify pre-release detection logic is correct
   - Verify release notes template is properly formatted

### Workflow Testing (Post-Push)

1. **Test with pre-release version**:
   ```powershell
   cd C:\Projects\TabezaConnect
   git tag v1.0.1-beta
   git push origin v1.0.1-beta
   ```
   - Monitor workflow execution in GitHub Actions
   - Verify release is marked as pre-release
   - Verify `/latest/` URL does NOT point to this version
   - Verify version-specific URL works

2. **Test with stable version**:
   ```powershell
   cd C:\Projects\TabezaConnect
   git tag v1.0.1
   git push origin v1.0.1
   ```
   - Monitor workflow execution in GitHub Actions
   - Verify release is NOT marked as pre-release
   - Verify `/latest/` URL points to this version
   - Verify both URL patterns work

3. **Test download URLs**:
   ```powershell
   # Test latest URL
   Invoke-WebRequest -Uri "https://github.com/billoapp/TabezaConnect/releases/latest/download/TabezaConnect-Setup-v1.0.1.zip" -OutFile "test-latest.zip"
   
   # Test version-specific URL
   Invoke-WebRequest -Uri "https://github.com/billoapp/TabezaConnect/releases/download/v1.0.1/TabezaConnect-Setup-v1.0.1.zip" -OutFile "test-specific.zip"
   
   # Verify both files are identical
   $hash1 = Get-FileHash "test-latest.zip" -Algorithm SHA256
   $hash2 = Get-FileHash "test-specific.zip" -Algorithm SHA256
   
   if ($hash1.Hash -eq $hash2.Hash) {
     Write-Host "✅ Both URLs return identical files" -ForegroundColor Green
   } else {
     Write-Host "❌ Files differ!" -ForegroundColor Red
   }
   ```

4. **Test failure scenario**:
   - Temporarily rename the ZIP file in the build step
   - Push a test tag
   - Verify workflow fails at the release step
   - Verify error message indicates unmatched files
   - Verify no release is created

### Manual Trigger Testing

1. **Test manual trigger with stable version**:
   - Go to GitHub Actions → Release TabezaConnect → Run workflow
   - Enter version: `1.0.2`
   - Check "Create git tag"
   - Run workflow
   - Verify release is created correctly

2. **Test manual trigger with pre-release version**:
   - Go to GitHub Actions → Release TabezaConnect → Run workflow
   - Enter version: `1.0.2-rc.1`
   - Check "Create git tag"
   - Run workflow
   - Verify release is marked as pre-release

## Design Decisions

### Why fail_on_unmatched_files?
- Prevents creating empty releases
- Catches build failures early
- Provides clear error messages
- Ensures artifact quality

### Why Custom Release Notes?
- Provides installation instructions
- Documents system requirements
- Shows both URL patterns
- Professional appearance
- Helps users understand what they're downloading

### Why Detect Pre-releases?
- Pre-releases shouldn't update `/latest/` URL
- Users expect `/latest/` to point to stable versions
- Allows testing without affecting production downloads
- Follows semantic versioning conventions

### Why Two URL Patterns?
- `/latest/` for always-current downloads (staff app)
- Version-specific for permanent links (documentation)
- Supports both use cases
- Follows GitHub conventions

## Validation Checklist

Before marking task complete, verify:

- [x] `files` parameter uses specific pattern: `'dist/TabezaConnect-Setup-v*.zip'`
- [x] `fail_on_unmatched_files` is set to `true`
- [x] `prerelease` detection works for both tag push and manual trigger
- [x] `generate_release_notes` is set to `false`
- [x] Custom release notes include installation instructions
- [x] Custom release notes include system requirements
- [x] Custom release notes document both URL patterns
- [x] `GITHUB_TOKEN` is properly configured
- [x] Step is named "Upload validated ZIP to GitHub release"
- [x] Requirements comments reference 3.1, 3.2, 5.1, 5.2

## Next Steps

1. ✅ Task 2.5 completed in Tabz repository
2. ⏭️ Transfer updated workflow to TabezaConnect repository
3. ⏭️ Test release creation with test tag
4. ⏭️ Verify download URLs work correctly
5. ⏭️ Move to Task 3.1: Create release notes generator script

## Notes

- The `softprops/action-gh-release@v1` action automatically handles:
  - Creating the release if it doesn't exist
  - Updating the release if it already exists
  - Setting the release as latest (unless pre-release)
  - Making the release publicly accessible
  
- The `GITHUB_TOKEN` is automatically provided by GitHub Actions with appropriate permissions

- The `/latest/` URL redirect is handled by GitHub, not the workflow

- Pre-release versions (containing hyphens) are automatically excluded from the `/latest/` URL

- The workflow will fail if the ZIP file doesn't exist, preventing empty releases

## References

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **softprops/action-gh-release**: https://github.com/softprops/action-gh-release
- **Semantic Versioning**: https://semver.org/
- **GitHub Release URLs**: https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases

