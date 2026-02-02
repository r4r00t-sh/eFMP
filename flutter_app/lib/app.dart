import 'package:flutter/material.dart';
import 'package:efiling_app/core/theme/app_theme.dart';

/// Root app widget placeholder (main uses MaterialApp.router directly).
class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: const Scaffold(body: Center(child: Text('EFMP'))),
    );
  }
}
