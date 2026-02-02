# GitHub Actions Workflows

## Flutter Release (APK + iOS)

**File:** `release-flutter.yml`

Builds the Flutter app (Android APK and iOS IPA) and publishes them to [GitHub Releases](https://github.com/r4r00t-sh/eFMP/releases).

### Triggers

- **Push a tag** starting with `v` (e.g. `v1.0.0`):  
  `git tag v1.0.0 && git push origin v1.0.0`
- **Manual run:** Actions → Flutter Release (APK + iOS) → Run workflow (optionally set version)

### What it does

1. **Tests:** Runs Flutter unit and widget tests (`flutter test`) on Ubuntu. **Build and release run only if tests pass.**
2. **Android:** Builds a release APK on Ubuntu (runs after tests). No extra secrets needed.
3. **iOS:** Builds on macOS (runs after tests):
   - **With signing:** Produces a signed IPA (App Store / Ad Hoc) if you add the secrets below.
   - **Without signing:** Produces an unsigned `.ipa` for internal/testing use.
4. **Release:** Creates a GitHub Release for the tag and attaches the APK and IPA (if built).

### iOS code signing (optional)

To get a **signed** IPA (for TestFlight / App Store or Ad Hoc), add these repository secrets in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `BUILD_CERTIFICATE_BASE64` | Your `.p12` distribution/development certificate, base64-encoded. `base64 -i YourCert.p12 \| pbcopy` |
| `P12_PASSWORD` | Password for the `.p12` file |
| `BUILD_PROVISION_PROFILE_BASE64` | Your `.mobileprovision` file, base64-encoded |
| `KEYCHAIN_PASSWORD` | Temporary password for the keychain created in the job (any string) |

If these are not set, the workflow still runs and uploads an **unsigned** iOS build for testing.

### Artifacts

- **APK:** `efiling_app-<tag>.apk` (e.g. `efiling_app-v1.0.0.apk`)
- **IPA:** Signed `efiling_app.ipa` or unsigned `efiling_app-unsigned.ipa` (when iOS build runs)
