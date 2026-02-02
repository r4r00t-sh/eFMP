import 'package:flutter/material.dart';

/// Breakpoints for phone vs tablet. Use for layout and padding.
class Responsive {
  static const double tabletBreakpoint = 600;
  static const double desktopBreakpoint = 900;

  static bool isPhone(BuildContext context) =>
      MediaQuery.sizeOf(context).width < tabletBreakpoint;
  static bool isTablet(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    return w >= tabletBreakpoint && w < desktopBreakpoint;
  }
  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= desktopBreakpoint;

  static bool isWide(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= tabletBreakpoint;

  /// Horizontal padding: 16 phone, 24 tablet, 32 desktop.
  static EdgeInsets padding(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    final h = w < tabletBreakpoint ? 16.0 : (w < desktopBreakpoint ? 24.0 : 32.0);
    return EdgeInsets.symmetric(horizontal: h);
  }

  /// Card/list max width for readability on wide screens.
  static double contentMaxWidth(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= desktopBreakpoint) return 800;
    if (w >= tabletBreakpoint) return 700;
    return double.infinity;
  }

  /// Grid cross axis count: 1 phone, 2 tablet, 3–4 desktop.
  static int gridCrossCount(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= desktopBreakpoint) return 4;
    if (w >= tabletBreakpoint) return 2;
    return 1;
  }
}
