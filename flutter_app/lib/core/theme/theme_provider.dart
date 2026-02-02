import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _themeModeKey = 'theme_mode';

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  static Future<ThemeMode> _loadStored() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getString(_themeModeKey);
    if (v == 'light') return ThemeMode.light;
    if (v == 'dark') return ThemeMode.dark;
    return ThemeMode.system;
  }

  static Future<ThemeProvider> create() async {
    final p = ThemeProvider();
    p._themeMode = await _loadStored();
    return p;
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeModeKey, mode == ThemeMode.light ? 'light' : mode == ThemeMode.dark ? 'dark' : 'system');
    notifyListeners();
  }
}
