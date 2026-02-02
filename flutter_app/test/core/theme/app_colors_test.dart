import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:efiling_app/core/theme/app_colors.dart';

void main() {
  group('AppColors', () {
    test('light theme colors are defined', () {
      expect(AppColors.lightBackground, isA<Color>());
      expect(AppColors.lightForeground, isA<Color>());
      expect(AppColors.lightPrimary, isA<Color>());
      expect(AppColors.lightCard, isA<Color>());
      expect(AppColors.lightMuted, isA<Color>());
      expect(AppColors.lightDestructive, isA<Color>());
    });

    test('dark theme colors are defined', () {
      expect(AppColors.darkBackground, isA<Color>());
      expect(AppColors.darkForeground, isA<Color>());
      expect(AppColors.darkPrimary, isA<Color>());
      expect(AppColors.darkCard, isA<Color>());
    });

    test('status colors are defined', () {
      expect(AppColors.amber, isA<Color>());
      expect(AppColors.blue, isA<Color>());
      expect(AppColors.green, isA<Color>());
      expect(AppColors.red, isA<Color>());
    });
  });
}
