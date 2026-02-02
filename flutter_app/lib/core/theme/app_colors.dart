import 'package:flutter/material.dart';

/// Colors matching frontend globals.css (HSL-based).
/// Light: --background 0 0% 100%, --foreground 0 0% 3.9%, --primary 0 0% 9%, etc.
class AppColors {
  AppColors._();

  // Light (same as :root in globals.css)
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightForeground = Color(0xFF0A0A0A);
  static const Color lightPrimary = Color(0xFF171717);
  static const Color lightPrimaryForeground = Color(0xFFFAFAFA);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightCardForeground = Color(0xFF0A0A0A);
  static const Color lightMuted = Color(0xFFF5F5F5);
  static const Color lightMutedForeground = Color(0xFF737373);
  static const Color lightAccent = Color(0xFFF5F5F5);
  static const Color lightAccentForeground = Color(0xFF171717);
  static const Color lightDestructive = Color(0xFFE53935);
  static const Color lightBorder = Color(0xFFE5E5E5);
  static const Color lightInput = Color(0xFFE5E5E5);
  static const Color lightRing = Color(0xFF171717);

  // Dark
  static const Color darkBackground = Color(0xFF0A0A0A);
  static const Color darkForeground = Color(0xFFFAFAFA);
  static const Color darkPrimary = Color(0xFFFAFAFA);
  static const Color darkPrimaryForeground = Color(0xFF171717);
  static const Color darkCard = Color(0xFF0A0A0A);
  static const Color darkCardForeground = Color(0xFFFAFAFA);
  static const Color darkMuted = Color(0xFF262626);
  static const Color darkMutedForeground = Color(0xFFA3A3A3);
  static const Color darkAccent = Color(0xFF262626);
  static const Color darkAccentForeground = Color(0xFFFAFAFA);
  static const Color darkDestructive = Color(0xFF7F1D1D);
  static const Color darkBorder = Color(0xFF262626);
  static const Color darkInput = Color(0xFF262626);
  static const Color darkRing = Color(0xFFD4D4D4);

  // Status (from dashboard/inbox)
  static const Color amber = Color(0xFFD97706);
  static const Color blue = Color(0xFF2563EB);
  static const Color green = Color(0xFF16A34A);
  static const Color red = Color(0xFFDC2626);
  static const Color slate = Color(0xFF64748B);
}
