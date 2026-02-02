import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';

class OpinionsInboxScreen extends StatefulWidget {
  const OpinionsInboxScreen({super.key});

  @override
  State<OpinionsInboxScreen> createState() => _OpinionsInboxScreenState();
}

class _OpinionsInboxScreenState extends State<OpinionsInboxScreen> {
  List<dynamic> _requests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<dynamic>('/opinions/pending');
      final data = res.data;
      _requests = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(24),
        itemCount: _requests.isEmpty ? 1 : _requests.length,
        itemBuilder: (context, i) {
          if (_requests.isEmpty) {
            return const Center(child: Padding(padding: EdgeInsets.all(48), child: Text('No pending opinion requests')));
          }
          final r = _requests[i] as Map<String, dynamic>;
          final requestId = r['id']?.toString() ?? r['opinionRequestId']?.toString();
          final fileId = r['fileId'] as String?;
          final status = r['status'] as String? ?? 'pending';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text('Opinion request for file ${fileId ?? '—'}'),
              subtitle: Text('Status: $status'),
              trailing: const Icon(Icons.arrow_forward),
              onTap: () {
                if (requestId != null && requestId.isNotEmpty) context.push('/opinions/$requestId');
              },
            ),
          );
        },
      ),
    );
  }
}
