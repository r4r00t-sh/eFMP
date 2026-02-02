import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/utils/responsive.dart';

class WorkflowsScreen extends StatefulWidget {
  const WorkflowsScreen({super.key});

  @override
  State<WorkflowsScreen> createState() => _WorkflowsScreenState();
}

class _WorkflowsScreenState extends State<WorkflowsScreen> {
  List<dynamic> _workflows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<dynamic>('/workflows');
      final data = res.data;
      _workflows = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final padding = Responsive.padding(context);
    return ListView.builder(
      padding: padding,
      itemCount: _workflows.length,
      itemBuilder: (context, i) {
        final w = _workflows[i] is Map ? _workflows[i] as Map<String, dynamic> : <String, dynamic>{};
        final id = w['id']?.toString() ?? '';
        final name = w['name']?.toString() ?? '';
        final code = w['code']?.toString() ?? '';
        final active = w['isActive'] == true;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.account_tree),
            title: Text(name),
            subtitle: Text('$code • ${active ? 'Active' : 'Inactive'}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              if (id.isNotEmpty) context.push('/admin/workflows/$id/builder');
            },
          ),
        );
      },
    );
  }
}
