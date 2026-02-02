import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart' show FormData, MultipartFile;
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/auth/auth_provider.dart';
import 'package:efiling_app/core/utils/responsive.dart';
import 'package:efiling_app/core/widgets/user_avatar.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _points;
  List<Map<String, dynamic>> _pointsHistory = [];
  bool _loadingPoints = true;
  bool _uploadingAvatar = false;
  int _avatarVersion = 0;
  bool _savingProfile = false;
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  bool _editMode = false;

  @override
  void initState() {
    super.initState();
    _syncFromUser();
    _loadPoints();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _syncFromUser() {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email ?? '';
    }
  }

  Future<void> _loadPoints() async {
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) {
      setState(() => _loadingPoints = false);
      return;
    }
    setState(() => _loadingPoints = true);
    try {
      final res = await ApiClient().get<dynamic>('/gamification/points/$userId');
      final data = res.data;
      if (mounted && data is Map) {
        setState(() {
          _points = Map<String, dynamic>.from(data as Map);
          _loadingPoints = false;
        });
      }
      final histRes = await ApiClient().get<dynamic>('/gamification/points/$userId/history', queryParameters: {'limit': '20'});
      final histData = histRes.data;
      final list = histData is List ? histData : (histData is Map && histData['data'] != null ? histData['data'] as List : []);
      if (mounted) setState(() {
        _pointsHistory = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {
      if (mounted) setState(() {
        _points = null;
        _loadingPoints = false;
      });
    }
  }

  Future<void> _saveProfile() async {
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;
    setState(() => _savingProfile = true);
    try {
      await ApiClient().put('/users/$userId', data: {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
      });
      if (mounted) {
        context.read<AuthProvider>().refreshUser();
        setState(() {
          _editMode = false;
          _savingProfile = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _savingProfile = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _uploadAvatar() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: false, type: FileType.image);
    if (result == null || result.files.isEmpty) return;
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;
    setState(() => _uploadingAvatar = true);
    try {
      final file = result.files.first;
      final formData = FormData();
      if (file.bytes != null) {
        formData.files.add(MapEntry('avatar', MultipartFile.fromBytes(file.bytes!, filename: file.name)));
      } else if (file.path != null && file.path!.isNotEmpty) {
        formData.files.add(MapEntry('avatar', await MultipartFile.fromFile(file.path!, filename: file.name)));
      }
      await ApiClient().dio.post('/users/$userId/avatar', data: formData);
      if (mounted) {
        context.read<AuthProvider>().refreshUser();
        setState(() {
          _uploadingAvatar = false;
          _avatarVersion++;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Avatar updated')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _uploadingAvatar = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final theme = Theme.of(context);
    final padding = Responsive.padding(context);
    if (user == null) return const Center(child: Text('Not logged in'));

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Profile', style: theme.textTheme.headlineSmall),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Stack(
                    children: [
                      UserAvatar(key: ValueKey(_avatarVersion), userId: user.id, name: user.name, radius: 40, fontSize: 32),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: IconButton(
                          onPressed: _uploadingAvatar ? null : _uploadAvatar,
                          icon: _uploadingAvatar ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.camera_alt),
                          style: IconButton.styleFrom(backgroundColor: theme.colorScheme.surfaceContainerHighest),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!_editMode) ...[
                          Text(user.name, style: theme.textTheme.titleLarge),
                          Text(user.username, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                          if (user.email != null && user.email!.isNotEmpty) Text(user.email!, style: theme.textTheme.bodyMedium),
                          if (user.roles != null && user.roles!.isNotEmpty) Text(user.roles!.join(', '), style: theme.textTheme.labelMedium),
                          const SizedBox(height: 8),
                          TextButton.icon(onPressed: () => setState(() => _editMode = true), icon: const Icon(Icons.edit), label: const Text('Edit profile')),
                        ] else ...[
                          TextField(
                            controller: _nameController,
                            decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder(), isDense: true),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _emailController,
                            decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder(), isDense: true),
                            keyboardType: TextInputType.emailAddress,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              TextButton(onPressed: () => setState(() { _editMode = false; _syncFromUser(); }), child: const Text('Cancel')),
                              const SizedBox(width: 8),
                              FilledButton(
                                onPressed: _savingProfile ? null : _saveProfile,
                                child: _savingProfile ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_points != null || _loadingPoints) ...[
            const SizedBox(height: 24),
            Text('Points', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _loadingPoints
                    ? const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(
                            children: [
                              Text((_points?['currentPoints'] ?? 0).toString(), style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                              Text('Current', style: theme.textTheme.bodySmall),
                            ],
                          ),
                          Column(
                            children: [
                              Text((_points?['basePoints'] ?? 0).toString(), style: theme.textTheme.titleLarge),
                              Text('Base', style: theme.textTheme.bodySmall),
                            ],
                          ),
                          Column(
                            children: [
                              Text((_points?['streakMonths'] ?? 0).toString(), style: theme.textTheme.titleLarge),
                              Text('Streak (months)', style: theme.textTheme.bodySmall),
                            ],
                          ),
                        ],
                      ),
              ),
            ),
          ],
          if (_pointsHistory.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Points history', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Card(
              child: ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _pointsHistory.length,
                itemBuilder: (context, i) {
                  final h = _pointsHistory[i];
                  final amount = h['amount'] ?? 0;
                  final type = h['type']?.toString() ?? '';
                  final createdAt = h['createdAt']?.toString() ?? '';
                  return ListTile(
                    dense: true,
                    leading: Icon(amount >= 0 ? Icons.add_circle : Icons.remove_circle, color: amount >= 0 ? theme.colorScheme.primary : theme.colorScheme.error),
                    title: Text(type),
                    subtitle: Text(createdAt.length > 20 ? createdAt.substring(0, 19) : createdAt),
                    trailing: Text('${amount >= 0 ? '+' : ''}$amount', style: theme.textTheme.titleSmall?.copyWith(color: amount >= 0 ? theme.colorScheme.primary : theme.colorScheme.error)),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}
