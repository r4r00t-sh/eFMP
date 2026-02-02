import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/models/file_model.dart';

class FilesListScreen extends StatefulWidget {
  const FilesListScreen({super.key});

  @override
  State<FilesListScreen> createState() => _FilesListScreenState();
}

class _FilesListScreenState extends State<FilesListScreen> {
  List<FileModel> _files = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<dynamic>('/files');
      final data = res.data;
      List list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      setState(() {
        _files = list.map((e) => FileModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(24),
        itemCount: _files.length,
        itemBuilder: (context, i) {
          final f = _files[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(f.subject),
              subtitle: Text('${f.fileNumber} • ${f.departmentName}'),
              trailing: Chip(label: Text(f.status)),
              onTap: () => context.push('/files/${f.id}'),
            ),
          );
        },
      ),
    );
  }
}
