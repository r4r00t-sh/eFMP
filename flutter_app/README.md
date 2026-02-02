# EFMP – E-Filing Management Platform (Flutter)

Cross-platform Flutter app that mirrors the EFiling-System web app: same features and UI (Roboto font, Dart 3.5 compatible).

## Features (aligned with web)

- **Auth**: Login, profile, logout; test accounts (admin, finadmin, etc.)
- **Dashboard**: Welcome, stats (Total / Pending / In Progress / Red Listed), recent files, quick actions
- **Files**: List, Inbox (search + status filter), file detail, new file, track file by number/ID
- **Opinions**: Opinion inbox (pending requests)
- **Admin** (role-based): Users, Analytics, Desks, Workflows
- **Chat**: Conversation list
- **Settings** & **Profile**

## Theme

- **Font**: Roboto (Google Fonts), compatible with Dart 3.5+.
- **Colors**: Same as `frontend/app/globals.css` (light/dark, primary, muted, destructive, etc.).
- **Radius**: 8px (0.5rem).

## Setup

1. **Flutter SDK** (3.2+): [flutter.dev](https://flutter.dev).

2. **Dependencies**:
   ```bash
   cd flutter_app
   flutter pub get
   ```

3. **API base URL**: Default is `http://localhost:3001`. For phone (same Wi‑Fi as backend), set your PC's IP when building:
   ```bash
   flutter build apk --dart-define=API_BASE_URL=http://YOUR_PC_IP:3001
   ```
   (Backend must bind on `0.0.0.0` so it accepts connections from the network.)

4. **Logo** (optional): Copy `frontend/public/logo.png` to `flutter_app/assets/logo.png` for branding on login/shell.

## Run

```bash
cd flutter_app
flutter run
```

- **Web**: `flutter run -d chrome`
- **Android**: `flutter run -d android`
- **iOS**: `flutter run -d ios`
- **Windows**: `flutter run -d windows`

## Project layout

- `lib/core/theme/` – App theme, Roboto, colors from web
- `lib/core/api/` – API client (Dio + Bearer token), config
- `lib/core/auth/` – AuthProvider (user + token, 401 → logout)
- `lib/core/router/` – go_router (login vs shell, role-based nav in shell)
- `lib/models/` – User, File models
- `lib/screens/` – Login, Dashboard, Shell (drawer), Files (list/inbox/detail/new/track), Opinions, Admin, Chat, Settings, Profile

Backend is the existing NestJS API; no backend code changes required.
