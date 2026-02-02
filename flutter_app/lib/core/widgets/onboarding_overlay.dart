import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kOnboardingDoneKey = 'onboarding_done';

/// One-time onboarding overlay. Shows "Welcome" and "Get started"; stores flag in SharedPreferences.
class OnboardingOverlay extends StatefulWidget {
  const OnboardingOverlay({super.key, required this.child});

  final Widget child;

  @override
  State<OnboardingOverlay> createState() => _OnboardingOverlayState();
}

class _OnboardingOverlayState extends State<OnboardingOverlay> {
  bool _show = true;
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final done = prefs.getBool(_kOnboardingDoneKey) ?? false;
    if (mounted) setState(() { _show = !done; _checked = true; });
  }

  Future<void> _complete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kOnboardingDoneKey, true);
    if (mounted) setState(() => _show = false);
  }

  @override
  Widget build(BuildContext context) {
    if (!_checked || !_show) return widget.child;
    final theme = Theme.of(context);
    return Stack(
      children: [
        widget.child,
        Material(
          color: theme.colorScheme.surface.withOpacity( 0.98),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.description, size: 72, color: theme.colorScheme.primary),
                  const SizedBox(height: 24),
                  Text('Welcome to EFMP', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Text(
                    'E-Filing Management Platform. Create files, track them, and collaborate with your team.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: _complete,
                    icon: const Icon(Icons.arrow_forward),
                    label: const Text('Get started'),
                    style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
