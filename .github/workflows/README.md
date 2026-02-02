# GitHub Actions Workflows

## Flutter Release (Android)

**File:** `release-flutter.yml`

Builds the Flutter app (Android APK only) and publishes it to [GitHub Releases](https://github.com/r4r00t-sh/eFMP/releases).

### Triggers

- **Push to master:** Runs tests and builds APK (no release).
- **Push a tag** starting with `v` (e.g. `v1.0.0`):  
  `git tag v1.0.0 && git push origin v1.0.0` — runs tests, builds APK, creates release.
- **Manual run:** Actions → Flutter Release (Android) → Run workflow (optionally set version)

### What it does

1. **Tests:** Runs Flutter unit and widget tests (`flutter test`) on Ubuntu. **Build and release run only if tests pass.**
2. **Android:** Builds a release APK on Ubuntu (runs after tests). No extra secrets needed.
3. **Release:** On tag push or manual run, creates a GitHub Release and attaches the APK.

### Artifacts

- **APK:** `efiling_app-<tag>.apk` (e.g. `efiling_app-v1.0.0.apk`)
