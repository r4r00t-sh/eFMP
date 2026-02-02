import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/theme/app_colors.dart';
import 'package:efiling_app/core/utils/responsive.dart';
import 'package:efiling_app/models/file_model.dart';

/// Track file detail – file details + routing history (read-only), matches web /files/track/[id].
class TrackFileDetailScreen extends StatefulWidget {
  const TrackFileDetailScreen({super.key, required this.fileId});

  final String fileId;

  @override
  State<TrackFileDetailScreen> createState() => _TrackFileDetailScreenState();
}

class _TrackFileDetailScreenState extends State<TrackFileDetailScreen> {
  FileModel? _file;
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
      final res = await ApiClient().get<Map<String, dynamic>>('/files/${widget.fileId}');
      final data = res.data;
      if (mounted && data != null) {
        setState(() {
          _file = FileModel.fromJson(data);
          _loading = false;
        });
      } else if (mounted) {
        setState(() => _loading = false);
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

  static String _statusLabel(String s) {
    switch (s) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'RETURNED': return 'Returned';
      case 'ON_HOLD': return 'On Hold';
      case 'RECALLED': return 'Recalled';
      default: return s;
    }
  }

  static final Map<String, String> _actionLabels = {
    'CREATED': 'Created',
    'FORWARDED': 'Forwarded',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'RETURNED_TO_HOST': 'Returned to host',
    'RETURNED_TO_PREVIOUS': 'Returned',
    'ON_HOLD': 'On hold',
    'RELEASED_FROM_HOLD': 'Released',
    'RECALLED': 'Recalled',
    'DISPATCHED': 'Dispatched',
    'CLOSED': 'Closed',
  };

  static IconData _iconForAction(String action) {
    switch (action) {
      case 'CREATED': return Icons.add_circle_outline;
      case 'FORWARDED': return Icons.send;
      case 'APPROVED': return Icons.check_circle_outline;
      case 'REJECTED': return Icons.cancel_outlined;
      case 'RETURNED_TO_HOST':
      case 'RETURNED_TO_PREVIOUS': return Icons.reply;
      case 'ON_HOLD': return Icons.pause_circle_outline;
      case 'RELEASED_FROM_HOLD': return Icons.play_circle_outline;
      case 'RECALLED': return Icons.shield;
      case 'DISPATCHED': return Icons.local_shipping_outlined;
      case 'CLOSED': return Icons.check_circle;
      default: return Icons.circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = Responsive.padding(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null || _file == null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(padding.left),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load file', style: theme.textTheme.titleLarge),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              ],
              const SizedBox(height: 24),
              FilledButton.icon(onPressed: () => context.go('/files/track'), icon: const Icon(Icons.arrow_back), label: const Text('Back to Track Files')),
            ],
          ),
        ),
      );
    }

    final f = _file!;
    final entries = <Map<String, dynamic>>[];
    if (f.createdBy != null && f.createdAt != null) {
      entries.add({
        'id': 'created',
        'action': 'CREATED',
        'remarks': 'Created by ${f.createdBy!['name']}',
        'createdAt': f.createdAt!.toIso8601String(),
      });
    }
    for (final r in f.routingHistory) {
      entries.add(Map<String, dynamic>.from(r));
    }
    entries.sort((a, b) => (a['createdAt']?.toString() ?? '').compareTo(b['createdAt']?.toString() ?? ''));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/files/track'),
        ),
        title: const Text('File journey'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(Icons.route, size: 32, color: theme.colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(f.fileNumber, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                        const SizedBox(height: 4),
                        Text(f.subject, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  if (f.isRedListed)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.red.withOpacity( 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text('RED LISTED', style: theme.textTheme.labelSmall?.copyWith(color: AppColors.red, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(label: Text(_statusLabel(f.status)), avatar: const Icon(Icons.info_outline, size: 18)),
                  Chip(label: Text(f.priority)),
                ],
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('File details', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 12),
                      if (f.description != null && f.description!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(f.description!, style: theme.textTheme.bodyMedium),
                        ),
                      _InfoRow(label: 'Department', value: f.departmentName),
                      _InfoRow(label: 'Current location', value: f.currentDivision?['name']?.toString() ?? '—'),
                      _InfoRow(label: 'Created by', value: f.createdBy?['name']?.toString() ?? '—'),
                      _InfoRow(label: 'Assigned to', value: f.assignedTo?['name']?.toString() ?? 'Unassigned'),
                      _InfoRow(label: 'Created', value: f.createdAt != null ? DateFormat.yMd().add_Hm().format(f.createdAt!) : '—'),
                      if (f.dueDate != null) _InfoRow(label: 'Due date', value: DateFormat.yMd().format(f.dueDate!)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('Routing history', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              if (entries.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Text('No routing history yet.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ),
                  ),
                )
              else
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ...entries.asMap().entries.map((e) {
                          final i = e.key;
                          final entry = e.value;
                          final action = entry['action']?.toString() ?? entry['actionString']?.toString() ?? '—';
                          final label = _actionLabels[action] ?? action;
                          final remarks = entry['remarks']?.toString();
                          final createdAt = entry['createdAt']?.toString();
                          final isLast = i == entries.length - 1;
                          final hasNext = i < entries.length - 1;
                          return IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: isLast ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: theme.colorScheme.primary.withOpacity( 0.5), width: 2),
                                      ),
                                      alignment: Alignment.center,
                                      child: Icon(
                                        _iconForAction(action),
                                        size: 20,
                                        color: isLast ? theme.colorScheme.onPrimary : theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                    if (hasNext)
                                      Container(
                                        width: 2,
                                        margin: const EdgeInsets.symmetric(vertical: 4),
                                        constraints: const BoxConstraints(minHeight: 24),
                                        color: theme.colorScheme.primary.withOpacity( 0.4),
                                      ),
                                  ],
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 20),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(child: Text(label, style: theme.textTheme.titleSmall)),
                                            if (isLast) ...[
                                              const SizedBox(width: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: theme.colorScheme.primary.withOpacity( 0.2),
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text('Current', style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                                              ),
                                            ],
                                          ],
                                        ),
                                        if (remarks != null && remarks.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 4),
                                            child: Text(remarks, style: theme.textTheme.bodySmall),
                                          ),
                                        if (createdAt != null && createdAt.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 2),
                                            child: Text(createdAt.length > 20 ? createdAt.substring(0, 19) : createdAt, style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                icon: const Icon(Icons.open_in_new),
                label: const Text('Open full file detail'),
                onPressed: () => context.push('/files/${f.id}'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant))),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
