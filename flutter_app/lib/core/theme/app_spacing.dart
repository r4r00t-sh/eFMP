/// 8px grid system for consistent margins & padding.
/// Use these values to avoid edge-hugging and keep layout predictable.
class AppSpacing {
  AppSpacing._();

  static const double xxs = 4;   // half unit (use sparingly)
  static const double xs = 8;
  static const double sm = 16;
  static const double md = 24;
  static const double lg = 32;
  static const double xl = 40;
  static const double xxl = 48;

  /// Minimum touch target (Android 48dp, Apple 44pt). Use 48 for both.
  static const double minTouchTarget = 48;
}
