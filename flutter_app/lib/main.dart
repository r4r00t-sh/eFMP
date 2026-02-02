import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:efiling_app/core/api/api_config.dart';
import 'package:efiling_app/core/auth/auth_provider.dart';
import 'package:efiling_app/core/router/app_router.dart';
import 'package:efiling_app/core/theme/app_theme.dart';
import 'package:efiling_app/core/theme/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.loadFromPrefs();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  final themeProvider = await ThemeProvider.create();
  runApp(EfilingApp(themeProvider: themeProvider));
}

class EfilingApp extends StatelessWidget {
  const EfilingApp({super.key, required this.themeProvider});

  final ThemeProvider themeProvider;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
        ChangeNotifierProvider(create: (_) => AuthProvider()..loadStoredAuth()),
      ],
      child: Consumer2<ThemeProvider, AuthProvider>(
        builder: (context, theme, auth, _) {
          return MaterialApp.router(
            title: 'EFMP',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: theme.themeMode,
            routerConfig: AppRouter.router(auth),
          );
        },
      ),
    );
  }
}
