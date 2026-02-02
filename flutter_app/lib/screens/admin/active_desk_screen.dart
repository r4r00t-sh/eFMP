import 'package:flutter/material.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/theme/app_colors.dart';

/// Active Desk: user presence and desk workload (mirrors web /admin/desk).
class ActiveDeskScreen extends StatefulWidget {
  const ActiveDeskScreen({super.key});

  @override
  State<ActiveDeskScreen> createState() => _ActiveDeskScreenState();
}

class _ActiveDeskScreenState extends State<ActiveDeskScreen> {
  Map<String, dynamic>? _deskStatus;
  Map<String, dynamic>? _workload;
  bool _loading = true;
  String? _error;

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
      final results = await Future.wait([
        ApiClient().get<dynamic>('/admin/desk-status').then((r) => r.data),
        ApiClient().get<dynamic>('/desks/workload/summary').then((r) => r.data),
      ]);
      if (mounted) {
        setState(() {
          _deskStatus = results[0] is Map ? Map<String, dynamic>.from(results[0] as Map) : null;
          _workload = results[1] is Map ? Map<String, dynamic>.from(results[1] as Map) : null;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('DioException: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load desk status', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              const SizedBox(height: 24),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final users = _deskStatus?['users'] as List<dynamic>? ?? [];
    final desks = _workload?['desks'] as List<dynamic>? ?? [];
    final totalDesks = _workload?['totalDesks'] ?? desks.length;
    final activeDesks = _workload?['activeDesks'] ?? 0;
    final totalFiles = _workload?['totalFiles'] ?? 0;
    final totalCapacity = _workload?['totalCapacity'] ?? 0;
    final overallUtilization = (_workload?['overallUtilization'] is num) ? (_workload!['overallUtilization'] as num).toDouble() : 0.0;

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Active Desk', style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('User presence and desk capacity', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 24),
            if (_workload != null) ...[
              Row(
                children: [
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Desks', style: theme.textTheme.labelMedium),
                            Text('$totalDesks total, $activeDesks active', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Files / Capacity', style: theme.textTheme.labelMedium),
                            Text('$totalFiles / $totalCapacity', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Utilization', style: theme.textTheme.labelMedium),
                            Text('${overallUtilization.toStringAsFixed(1)}%', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: overallUtilization >= 100 ? AppColors.red : null)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              if (desks.isNotEmpty) ...[
                Text('Desk capacity', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                ...desks.map<Widget>((d) {
                  final map = d is Map ? d as Map<String, dynamic> : <String, dynamic>{};
                  final name = map['name']?.toString() ?? '—';
                  final current = (map['currentFiles'] ?? map['currentFileCount'] ?? 0) as num;
                  final max = (map['maxFiles'] ?? map['maxFilesPerDay'] ?? 0) as num;
                  final util = (map['utilization'] ?? map['capacityUtilizationPercent'] ?? 0) as num;
                  final isFull = map['isFull'] == true || (max > 0 && current >= max);
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Icon(Icons.desktop_windows, color: isFull ? AppColors.red : theme.colorScheme.primary),
                      title: Text(name),
                      subtitle: LinearProgressIndicator(
                        value: max > 0 ? (current / max).clamp(0.0, 1.0) : 0,
                        backgroundColor: theme.colorScheme.surfaceContainerHighest,
                        valueColor: AlwaysStoppedAnimation<Color>(isFull ? AppColors.red : theme.colorScheme.primary),
                      ),
                      trailing: Text('${current.toInt()} / ${max.toInt()}'),
                    ),
                  );
                }),
                const SizedBox(height: 24),
              ],
            ],
            if (users.isNotEmpty) ...[
              Text('Online users', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Card(
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: users.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final u = users[i] is Map ? users[i] as Map<String, dynamic> : <String, dynamic>{};
                    final name = u['name']?.toString() ?? '—';
                    final status = u['presenceStatus']?.toString() ?? u['status']?.toString() ?? 'ABSENT';
                    final statusLabel = u['statusLabel']?.toString() ?? (status == 'ACTIVE' ? 'Active' : status == 'SESSION_TIMEOUT' ? 'Session Expired' : 'Offline');
                    final isActive = status == 'ACTIVE';
                    return ListTile(
                      leading: CircleAvatar(
                        child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?'),
                        backgroundColor: isActive ? AppColors.green : theme.colorScheme.surfaceContainerHighest,
                      ),
                      title: Text(name),
                      subtitle: Text(u['username']?.toString() ?? ''),
                      trailing: Chip(
                        label: Text(statusLabel),
                        backgroundColor: isActive ? AppColors.green.withOpacity( 0.2) : null,
                      ),
                    );
                  },
                ),
              ),
            ],
            if (users.isEmpty && desks.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Text('No desk or presence data', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
