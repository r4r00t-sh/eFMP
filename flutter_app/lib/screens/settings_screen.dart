import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:efiling_app/core/api/api_config.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/auth/auth_provider.dart';
import 'package:efiling_app/core/theme/theme_provider.dart';
import 'package:efiling_app/core/utils/responsive.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;
  bool _sound = true;
  String _defaultView = 'list';
  bool _changingPassword = false;
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _serverUrlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _serverUrlController.text = ApiConfig.baseUrl;
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _serverUrlController.dispose();
    super.dispose();
  }

  Future<void> _saveServerUrl() async {
    final url = _serverUrlController.text.trim();
    if (url.isEmpty) return;
    await ApiConfig.setBaseUrl(url);
    ApiClient().reset();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Server URL saved. New requests will use it.')),
      );
    }
  }

  Future<void> _changePassword() async {
    final newP = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;
    if (newP.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('New password must be at least 6 characters')));
      return;
    }
    if (newP != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
      return;
    }
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;
    setState(() => _changingPassword = true);
    try {
      await ApiClient().put('/users/$userId/password', data: {
        'currentPassword': _currentPasswordController.text,
        'newPassword': newP,
      });
      if (mounted) {
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
    if (mounted) setState(() => _changingPassword = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = Responsive.padding(context);
    final themeProvider = context.watch<ThemeProvider>();
    final user = context.watch<AuthProvider>().user;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Settings', style: theme.textTheme.headlineSmall),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Server URL', style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _serverUrlController,
                          decoration: const InputDecoration(
                            hintText: 'e.g. http://192.168.1.100:3001',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          keyboardType: TextInputType.url,
                          autocorrect: false,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: FilledButton.tonal(onPressed: _saveServerUrl, child: const Text('Save')),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: const Text('Profile'),
                  subtitle: user != null ? Text(user.name) : null,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/profile'),
                ),
                const Divider(height: 1),
                ListTile(
                  title: const Text('Theme'),
                  subtitle: Text(themeProvider.themeMode == ThemeMode.light ? 'Light' : themeProvider.themeMode == ThemeMode.dark ? 'Dark' : 'System'),
                  trailing: DropdownButton<ThemeMode>(
                    value: themeProvider.themeMode,
                    items: const [
                      DropdownMenuItem(value: ThemeMode.light, child: Text('Light')),
                      DropdownMenuItem(value: ThemeMode.dark, child: Text('Dark')),
                      DropdownMenuItem(value: ThemeMode.system, child: Text('System')),
                    ],
                    onChanged: (v) {
                      if (v != null) themeProvider.setThemeMode(v);
                    },
                  ),
                ),
                const Divider(height: 1),
                ListTile(title: const Text('Notifications'), subtitle: const Text('Email and push'), trailing: Switch(value: _notifications, onChanged: (v) => setState(() => _notifications = v))),
                const Divider(height: 1),
                ListTile(title: const Text('Sound'), subtitle: const Text('Sound effects'), trailing: Switch(value: _sound, onChanged: (v) => setState(() => _sound = v))),
                const Divider(height: 1),
                ListTile(
                  title: const Text('Default view'),
                  subtitle: const Text('List or grid'),
                  trailing: DropdownButton<String>(
                    value: _defaultView,
                    items: const [DropdownMenuItem(value: 'list', child: Text('List')), DropdownMenuItem(value: 'grid', child: Text('Grid'))],
                    onChanged: (v) => setState(() => _defaultView = v ?? 'list'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Change password', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _currentPasswordController,
                    decoration: const InputDecoration(labelText: 'Current password', border: OutlineInputBorder()),
                    obscureText: true,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _newPasswordController,
                    decoration: const InputDecoration(labelText: 'New password', border: OutlineInputBorder()),
                    obscureText: true,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _confirmPasswordController,
                    decoration: const InputDecoration(labelText: 'Confirm new password', border: OutlineInputBorder()),
                    obscureText: true,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _changingPassword ? null : _changePassword,
                    child: _changingPassword ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Update password'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
