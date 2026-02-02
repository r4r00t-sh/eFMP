import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/theme/app_colors.dart';
import 'package:efiling_app/core/utils/responsive.dart';
import 'package:efiling_app/models/file_model.dart';

/// Track Files list – matches web: lists files with stats and filters; tap file → track detail (file details + route history).
class TrackFileScreen extends StatefulWidget {
  const TrackFileScreen({super.key});

  @override
  State<TrackFileScreen> createState() => _TrackFileScreenState();
}

class _TrackFileScreenState extends State<TrackFileScreen> {
  List<FileModel> _allFiles = [];
  List<FileModel> _files = [];
  bool _loading = true;
  String? _error;
  String _searchQuery = '';
  String _statusFilter = 'all';
  String _priorityFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get<dynamic>('/files');
      final data = res.data;
      List list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) {
        setState(() {
          _allFiles = list.map((e) => FileModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
          _applyFilters();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('DioException: ', '');
          _allFiles = [];
          _files = [];
          _loading = false;
        });
      }
    }
  }

  void _applyFilters() {
    var filtered = List<FileModel>.from(_allFiles);
    if (_statusFilter != 'all') {
      filtered = filtered.where((f) => f.status == _statusFilter).toList();
    }
    if (_priorityFilter != 'all') {
      filtered = filtered.where((f) => f.priority == _priorityFilter).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filtered = filtered.where((f) =>
          f.fileNumber.toLowerCase().contains(q) ||
          (f.subject.toLowerCase().contains(q))).toList();
    }
    _files = filtered;
  }

  int get _total => _allFiles.length;
  int get _pending => _allFiles.where((f) => f.status == 'PENDING').length;
  int get _inProgress => _allFiles.where((f) => f.status == 'IN_PROGRESS').length;
  int get _completed => _allFiles.where((f) => f.status == 'APPROVED').length;

  static String _statusLabel(String s) {
    switch (s) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'ON_HOLD': return 'On Hold';
      case 'RECALLED': return 'Recalled';
      default: return s;
    }
  }

  static String _priorityLabel(String s) {
    switch (s) {
      case 'LOW': return 'Low';
      case 'NORMAL': return 'Normal';
      case 'HIGH': return 'High';
      case 'URGENT': return 'Urgent';
      default: return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = Responsive.padding(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(padding.left),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load files', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              const SizedBox(height: 24),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.route, size: 40, color: theme.colorScheme.primary),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Track Files', style: theme.textTheme.headlineSmall),
                      const SizedBox(height: 4),
                      Text(
                        'Select a file to view its journey and routing history',
                        style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            LayoutBuilder(
              builder: (context, constraints) {
                final crossAxisCount = constraints.maxWidth > 600 ? 4 : 2;
                return GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: crossAxisCount,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.4,
                  children: [
                    _StatCard(
                      label: 'Total Files',
                      value: _total,
                      icon: Icons.description,
                      selected: _statusFilter == 'all',
                      onTap: () => setState(() { _statusFilter = 'all'; _applyFilters(); }),
                    ),
                    _StatCard(
                      label: 'Pending',
                      value: _pending,
                      icon: Icons.schedule,
                      color: AppColors.amber,
                      selected: _statusFilter == 'PENDING',
                      onTap: () => setState(() { _statusFilter = 'PENDING'; _applyFilters(); }),
                    ),
                    _StatCard(
                      label: 'In Progress',
                      value: _inProgress,
                      icon: Icons.trending_up,
                      color: Colors.blue,
                      selected: _statusFilter == 'IN_PROGRESS',
                      onTap: () => setState(() { _statusFilter = 'IN_PROGRESS'; _applyFilters(); }),
                    ),
                    _StatCard(
                      label: 'Completed',
                      value: _completed,
                      icon: Icons.check_circle,
                      color: Colors.green,
                      selected: _statusFilter == 'APPROVED',
                      onTap: () => setState(() { _statusFilter = 'APPROVED'; _applyFilters(); }),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search by file number or subject...',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onChanged: (v) {
                        setState(() {
                          _searchQuery = v;
                          _applyFilters();
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _statusFilter,
                            decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder(), isDense: true),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Status')),
                              DropdownMenuItem(value: 'PENDING', child: Text('Pending')),
                              DropdownMenuItem(value: 'IN_PROGRESS', child: Text('In Progress')),
                              DropdownMenuItem(value: 'APPROVED', child: Text('Approved')),
                              DropdownMenuItem(value: 'REJECTED', child: Text('Rejected')),
                              DropdownMenuItem(value: 'ON_HOLD', child: Text('On Hold')),
                            ],
                            onChanged: (v) => setState(() { _statusFilter = v ?? 'all'; _applyFilters(); }),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _priorityFilter,
                            decoration: const InputDecoration(labelText: 'Priority', border: OutlineInputBorder(), isDense: true),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Priority')),
                              DropdownMenuItem(value: 'URGENT', child: Text('Urgent')),
                              DropdownMenuItem(value: 'HIGH', child: Text('High')),
                              DropdownMenuItem(value: 'NORMAL', child: Text('Normal')),
                              DropdownMenuItem(value: 'LOW', child: Text('Low')),
                            ],
                            onChanged: (v) => setState(() { _priorityFilter = v ?? 'all'; _applyFilters(); }),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_files.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(Icons.map_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(height: 16),
                      Text('No files found', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isNotEmpty || _statusFilter != 'all' || _priorityFilter != 'all'
                            ? 'Try adjusting your filters'
                            : 'No files available to track',
                        style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              Card(
                child: Column(
                  children: [
                    ..._files.map((file) {
                      final location = file.currentDivision?['name']?.toString() ?? file.departmentName ?? '—';
                      return ListTile(
                        leading: file.isRedListed
                            ? Icon(Icons.warning_amber, color: AppColors.red, size: 24)
                            : null,
                        title: Text(file.subject, overflow: TextOverflow.ellipsis),
                        subtitle: Text(
                          '${file.fileNumber} • $location • ${_statusLabel(file.status)} • ${_priorityLabel(file.priority)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/files/track/${file.id}'),
                      );
                    }),
                  ],
                ),
              ),
            if (_files.isNotEmpty) ...[
              const SizedBox(height: 16),
              Center(
                child: Text(
                  'Showing ${_files.length} of ${_allFiles.length} files • Tap a file to view its journey',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;
  final Color? color;
  final bool selected;
  final VoidCallback onTap;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = color ?? theme.colorScheme.primary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Card(
        elevation: selected ? 2 : 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: selected ? BorderSide(color: c, width: 2) : BorderSide.none,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.max,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    const SizedBox(height: 4),
                    Text('$value', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: c)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Icon(icon, color: c, size: 28),
            ],
          ),
        ),
      ),
    );
  }
}
