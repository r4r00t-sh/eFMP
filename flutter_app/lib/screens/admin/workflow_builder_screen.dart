import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/utils/responsive.dart';

/// Workflow builder – view/edit workflow steps (simplified; full visual editor can be added later).
/// Responsive: single column on phone, two columns on tablet.
class WorkflowBuilderScreen extends StatefulWidget {
  const WorkflowBuilderScreen({super.key, required this.workflowId});

  final String workflowId;

  @override
  State<WorkflowBuilderScreen> createState() => _WorkflowBuilderScreenState();
}

class _WorkflowBuilderScreenState extends State<WorkflowBuilderScreen> {
  Map<String, dynamic>? _workflow;
  List<dynamic> _nodes = [];
  List<dynamic> _edges = [];
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
      final res = await ApiClient().get<dynamic>('/workflows/${widget.workflowId}');
      final data = res.data;
      if (mounted && data is Map) {
        final w = Map<String, dynamic>.from(data as Map);
        setState(() {
          _workflow = w;
          _nodes = w['nodes'] is List ? List<dynamic>.from(w['nodes'] as List) : [];
          _edges = w['edges'] is List ? List<dynamic>.from(w['edges'] as List) : [];
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

  static IconData _nodeIcon(String? nodeType) {
    switch (nodeType) {
      case 'start': return Icons.play_circle_outline;
      case 'task': return Icons.check_box_outlined;
      case 'decision': return Icons.call_split;
      case 'end': return Icons.stop_circle_outlined;
      default: return Icons.circle_outlined;
    }
  }

  static Color _nodeColor(BuildContext context, String? nodeType) {
    final theme = Theme.of(context);
    switch (nodeType) {
      case 'start': return Colors.green;
      case 'task': return theme.colorScheme.primary;
      case 'decision': return Colors.amber;
      case 'end': return theme.colorScheme.outline;
      default: return theme.colorScheme.primary;
    }
  }

  String _nodeLabel(Map<String, dynamic> node) {
    return node['label']?.toString() ?? node['nodeId']?.toString() ?? 'Node';
  }

  Map<String, dynamic>? _findNode(String? id) {
    if (id == null) return null;
    for (final n in _nodes) {
      if (n is Map && n['id']?.toString() == id) return Map<String, dynamic>.from(n as Map);
    }
    return null;
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
          padding: padding,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load workflow', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              const SizedBox(height: 24),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
              const SizedBox(height: 8),
              TextButton(onPressed: () => context.go('/admin/workflows'), child: const Text('Back to Workflows')),
            ],
          ),
        ),
      );
    }

    final name = _workflow?['name']?.toString() ?? 'Workflow';
    final code = _workflow?['code']?.toString() ?? '';
    final description = _workflow?['description']?.toString();
    final isActive = _workflow?['isActive'] == true;
    final isDraft = _workflow?['isDraft'] == true;

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        padding: padding,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: Responsive.contentMaxWidth(context)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/admin/workflows')),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text(name, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold))),
                            if (isActive)
                              Chip(
                                avatar: const Icon(Icons.check_circle, size: 16, color: Colors.green),
                                label: const Text('Active', style: TextStyle(fontSize: 12)),
                                padding: EdgeInsets.zero,
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              )
                            else if (isDraft)
                              Chip(
                                avatar: Icon(Icons.edit, size: 16, color: theme.colorScheme.primary),
                                label: const Text('Draft', style: TextStyle(fontSize: 12)),
                                padding: EdgeInsets.zero,
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                          ],
                        ),
                        if (code.isNotEmpty) Text(code, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                        if (description != null && description.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(description, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text('Nodes', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              if (_nodes.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Text('No nodes defined', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ),
                  ),
                )
              else
                ...List.generate(_nodes.length, (i) {
                  final node = _nodes[i] is Map ? _nodes[i] as Map<String, dynamic> : <String, dynamic>{};
                  final nodeType = node['nodeType']?.toString() ?? 'task';
                  final label = _nodeLabel(node);
                  final desc = node['description']?.toString();
                  final assigneeType = node['assigneeType']?.toString();
                  final assigneeValue = node['assigneeValue']?.toString();
                  final timeLimit = node['timeLimit'] is num ? (node['timeLimit'] as num).toInt() : null;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: _nodeColor(context, nodeType).withOpacity( 0.2),
                            child: Icon(_nodeIcon(nodeType), color: _nodeColor(context, nodeType), size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(label, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                Chip(
                                  label: Text(nodeType, style: const TextStyle(fontSize: 11)),
                                  padding: EdgeInsets.zero,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  visualDensity: VisualDensity.compact,
                                ),
                                if (desc != null && desc.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(desc, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                                  ),
                                if (assigneeType != null && assigneeType.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    'Assignee: ${assigneeType.toLowerCase()}${assigneeValue != null && assigneeValue.isNotEmpty ? ' ($assigneeValue)' : ''}',
                                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                  ),
                                ],
                                if (timeLimit != null && timeLimit > 0)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      'Time limit: ${timeLimit ~/ 3600}h',
                                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 24),
              Text('Connections', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              if (_edges.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Text('No connections yet', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ),
                  ),
                )
              else
                ...List.generate(_edges.length, (i) {
                  final edge = _edges[i] is Map ? _edges[i] as Map<String, dynamic> : <String, dynamic>{};
                  final sourceId = edge['sourceNodeId']?.toString();
                  final targetId = edge['targetNodeId']?.toString();
                  final edgeLabel = edge['label']?.toString();
                  final sourceNode = _findNode(sourceId);
                  final targetNode = _findNode(targetId);
                  final sourceLabel = sourceNode != null ? _nodeLabel(sourceNode) : 'Unknown';
                  final targetLabel = targetNode != null ? _nodeLabel(targetNode) : 'Unknown';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: const Icon(Icons.arrow_forward),
                      title: Text('$sourceLabel → $targetLabel'),
                      subtitle: edgeLabel != null && edgeLabel.isNotEmpty ? Text(edgeLabel) : null,
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}
