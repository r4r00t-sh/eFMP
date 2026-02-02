import 'package:flutter/material.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/theme/app_colors.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _data;
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
      final res = await ApiClient().get<Map<String, dynamic>>('/analytics/dashboard');
      setState(() {
        _data = res.data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('DioException: ', '');
        _loading = false;
      });
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
              Text('Failed to load analytics', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              const SizedBox(height: 24),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final summary = _data?['summary'] as Map<String, dynamic>?;
    final filesByPriority = _data?['filesByPriority'] as List<dynamic>? ?? [];
    final filesByCategory = _data?['filesByPriorityCategory'] as List<dynamic>? ?? [];

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Analytics', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text('Dashboard metrics and file statistics', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 24),
              if (summary != null) ...[
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: MediaQuery.of(context).size.width > 600 ? 4 : 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    _StatCard(title: 'Total Files', value: '${summary['totalFiles'] ?? 0}', icon: Icons.description, color: theme.colorScheme.primary),
                    _StatCard(title: 'Pending', value: '${summary['pendingFiles'] ?? 0}', icon: Icons.schedule, color: AppColors.amber),
                    _StatCard(title: 'In Progress', value: '${summary['inProgressFiles'] ?? 0}', icon: Icons.trending_up, color: AppColors.blue),
                    _StatCard(title: 'Completed', value: '${summary['completedFiles'] ?? 0}', icon: Icons.check_circle, color: AppColors.green),
                    _StatCard(title: 'Red Listed', value: '${summary['redListedFiles'] ?? 0}', icon: Icons.warning_amber, color: AppColors.red),
                    _StatCard(title: 'On Hold', value: '${summary['onHoldFiles'] ?? 0}', icon: Icons.pause_circle, color: AppColors.slate),
                    _StatCard(title: 'Total Users', value: '${summary['totalUsers'] ?? 0}', icon: Icons.people, color: theme.colorScheme.secondary),
                    _StatCard(title: 'Active Today', value: '${summary['activeUsersToday'] ?? 0}', icon: Icons.person, color: AppColors.green),
                  ],
                ),
                const SizedBox(height: 24),
                if (summary['completionRate'] != null || summary['redListRate'] != null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          if (summary['completionRate'] != null)
                            Column(
                              children: [
                                Text('Completion Rate', style: theme.textTheme.labelMedium),
                                Text('${(summary['completionRate'] as num).toStringAsFixed(1)}%', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                              ],
                            ),
                          if (summary['redListRate'] != null)
                            Column(
                              children: [
                                Text('Red List Rate', style: theme.textTheme.labelMedium),
                                Text('${(summary['redListRate'] as num).toStringAsFixed(1)}%', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: AppColors.red)),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
              ],
              if (filesByPriority.isNotEmpty) ...[
                Text('Files by Priority', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filesByPriority.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final p = filesByPriority[i] is Map ? filesByPriority[i] as Map<String, dynamic> : <String, dynamic>{};
                      final priority = p['priority']?.toString() ?? '—';
                      final count = p['count'] ?? (p['_count'] is Map ? (p['_count'] as Map)['id'] : null) ?? 0;
                      return ListTile(title: Text(priority), trailing: Text('$count'));
                    },
                  ),
                ),
                const SizedBox(height: 24),
              ],
              if (filesByCategory.isNotEmpty) ...[
                Text('Files by Category', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filesByCategory.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final c = filesByCategory[i] is Map ? filesByCategory[i] as Map<String, dynamic> : <String, dynamic>{};
                      final category = c['category']?.toString() ?? c['priorityCategory']?.toString() ?? '—';
                      final count = c['count'] ?? (c['_count'] is Map ? (c['_count'] as Map)['id'] : null) ?? 0;
                      return ListTile(title: Text(category), trailing: Text('$count'));
                    },
                  ),
                ),
              ],
              if (summary == null && filesByPriority.isEmpty && filesByCategory.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Text('No analytics data available', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 8),
                Expanded(child: Text(title, style: theme.textTheme.labelMedium, overflow: TextOverflow.ellipsis)),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
