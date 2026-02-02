import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/theme/app_spacing.dart';
import 'package:efiling_app/models/file_model.dart';

/// Global search: pages (Dashboard, Inbox, Track, Chat, etc.) + files (by number/subject).
/// User can search anything they're allowed to access.
class GlobalSearchScreen extends StatefulWidget {
  const GlobalSearchScreen({super.key});

  @override
  State<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends State<GlobalSearchScreen> {
  final _queryController = TextEditingController();
  final _focusNode = FocusNode();
  String _query = '';
  List<FileModel> _fileResults = [];
  bool _loadingFiles = false;
  static const _minQueryLength = 1;

  static const List<({IconData icon, String label, String path})> _pages = [
    (icon: Icons.dashboard_outlined, label: 'Dashboard', path: '/dashboard'),
    (icon: Icons.inbox_outlined, label: 'Inbox', path: '/files/inbox'),
    (icon: Icons.folder_outlined, label: 'My Files', path: '/files'),
    (icon: Icons.add_box_outlined, label: 'New File', path: '/files/new'),
    (icon: Icons.pin_drop_outlined, label: 'Track File', path: '/files/track'),
    (icon: Icons.pending_actions_outlined, label: 'Approvals', path: '/files/approvals'),
    (icon: Icons.chat_bubble_outline, label: 'Chat', path: '/chat'),
    (icon: Icons.notifications_outlined, label: 'Notifications', path: '/notifications'),
    (icon: Icons.help_outline, label: 'Help', path: '/help'),
    (icon: Icons.settings_outlined, label: 'Settings', path: '/settings'),
    (icon: Icons.person_outline, label: 'Profile', path: '/profile'),
    (icon: Icons.analytics_outlined, label: 'Analytics', path: '/admin/analytics'),
    (icon: Icons.people_outline, label: 'Users', path: '/admin/users'),
    (icon: Icons.desktop_windows_outlined, label: 'Desk Capacity', path: '/admin/desks'),
    (icon: Icons.monitor_outlined, label: 'Active Desk', path: '/admin/desk'),
    (icon: Icons.account_tree_outlined, label: 'Workflows', path: '/admin/workflows'),
    (icon: Icons.send_outlined, label: 'Dispatch', path: '/dispatch'),
    (icon: Icons.history, label: 'Dispatch History', path: '/dispatch/history'),
    (icon: Icons.message_outlined, label: 'Opinion Inbox', path: '/opinions/inbox'),
  ];

  @override
  void initState() {
    super.initState();
    _queryController.addListener(_onQueryChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _queryController.removeListener(_onQueryChanged);
    _queryController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onQueryChanged() {
    final q = _queryController.text.trim().toLowerCase();
    setState(() {
      _query = q;
      if (q.length >= _minQueryLength) _searchFiles(q);
      else _fileResults = [];
    });
  }

  Future<void> _searchFiles(String q) async {
    setState(() => _loadingFiles = true);
    try {
      final res = await ApiClient().get<dynamic>('/files', queryParameters: {'search': q});
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) {
        setState(() {
          _fileResults = list.map((e) => FileModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
          _loadingFiles = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _fileResults = []; _loadingFiles = false; });
    }
  }

  List<({IconData icon, String label, String path})> get _filteredPages {
    if (_query.isEmpty) return _pages;
    return _pages.where((p) => p.label.toLowerCase().contains(_query)).toList();
  }

  void _navigate(String path) {
    context.pop();
    context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pages = _filteredPages;
    final showFiles = _query.length >= _minQueryLength;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _queryController,
              focusNode: _focusNode,
              decoration: InputDecoration(
                hintText: 'Search pages or files...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: (_) {},
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 8),
        children: [
          if (pages.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('Pages', style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            ),
            ...pages.map((p) => ListTile(
              leading: Icon(p.icon, color: theme.colorScheme.primary),
              title: Text(p.label),
              onTap: () => _navigate(p.path),
            )),
            const Divider(height: 24),
          ],
          if (showFiles) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('Files', style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            ),
            if (_loadingFiles)
              const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))
            else if (_fileResults.isEmpty)
              Padding(
                padding: const EdgeInsets.all(24),
                child: Text('No files match "$_query"', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              )
            else
              ..._fileResults.map((f) => ListTile(
                leading: const Icon(Icons.description_outlined),
                title: Text(f.subject),
                subtitle: Text(f.fileNumber),
                onTap: () => _navigate('/files/${f.id}'),
              )),
          ],
        ],
      ),
    );
  }
}
