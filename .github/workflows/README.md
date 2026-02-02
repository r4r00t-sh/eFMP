# GitHub Actions Workflows

## Flutter Release (Android)

**File:** `release-flutter.yml`

Builds the Flutter app (Android APK only) and publishes it to [GitHub Releases](https://github.com/r4r00t-sh/eFMP/releases).

**Runs only when `flutter_app/**` changes** (or on tag push / manual run). Changes to the web app (frontend) do not trigger this workflow.

### Triggers

- **Push to master:** Runs only if `flutter_app/**` changed — runs tests and builds APK (no release).
- **Push a tag** starting with `v` (e.g. `v1.0.0`):  
  `git tag v1.0.0 && git push origin v1.0.0` — runs tests, builds APK, creates release.
- **Manual run:** Actions → Flutter Release (Android) → Run workflow (optionally set version)

### What it does

1. **Changes check:** Detects if `flutter_app/**` changed; skips test/build when only other paths (e.g. frontend) changed.
2. **Tests:** Flutter unit and widget tests (`flutter test`). Build and release run only if tests pass.
3. **Android:** Builds a release APK. No extra secrets needed.
4. **Release:** On tag push or manual run, creates a GitHub Release and attaches the APK.

### Artifacts

- **APK:** `efiling_app-<tag>.apk` (e.g. `efiling_app-v1.0.0.apk`)

---

## Frontend (Web App)

**File:** `frontend-ci.yml`

Lint, test, and build the Next.js web app.

**Runs only when `frontend/**` changes.** Changes to the Flutter app do not trigger this workflow.

### Triggers

- **Push to master:** Runs only if `frontend/**` changed — lint, test, build.
- **Manual run:** Actions → Frontend (Web App) → Run workflow

### What it does

1. **Lint:** `npm run lint` (ESLint)
2. **Test:** `npm run test` (Vitest)
3. **Build:** `npm run build` (Next.js)
