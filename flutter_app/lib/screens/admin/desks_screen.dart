import 'package:flutter/material.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/utils/responsive.dart';

class DesksScreen extends StatefulWidget {
  const DesksScreen({super.key});

  @override
  State<DesksScreen> createState() => _DesksScreenState();
}

class _DesksScreenState extends State<DesksScreen> {
  List<dynamic> _desks = [];
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
      final res = await ApiClient().get<dynamic>('/desks');
      final data = res.data;
      if (data is List) {
        _desks = List<dynamic>.from(data);
      } else if (data is Map<String, dynamic>) {
        if (data['data'] is List) {
          _desks = List<dynamic>.from(data['data'] as List);
        } else if (data['desks'] is List) {
          _desks = List<dynamic>.from(data['desks'] as List);
        } else {
          _desks = [];
        }
      } else {
        _desks = [];
      }
    } catch (e) {
      _error = e.toString().replaceFirst('DioException: ', '');
      _desks = [];
    }
    if (mounted) setState(() => _loading = false);
  }

  void _showCreateDesk() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => const _CreateDeskSheet(),
    );
    if (result == true && mounted) _load();
  }

  void _showEditDesk(Map<String, dynamic> desk) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _EditDeskSheet(desk: desk),
    );
    if (result == true && mounted) _load();
  }

  Future<void> _deleteDesk(Map<String, dynamic> desk) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete desk'),
        content: Text('Delete desk "${desk['name'] ?? 'Unnamed'}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error), onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await ApiClient().delete('/desks/${desk['id']}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Desk deleted')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
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
              Text('Failed to load desks', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 24),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    if (_desks.isEmpty) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(padding.left),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.desktop_windows_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(height: 16),
                Text('No desks yet', style: theme.textTheme.titleLarge),
                Text('Create a desk to get started.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 24),
                FilledButton.icon(onPressed: _showCreateDesk, icon: const Icon(Icons.add), label: const Text('Create desk')),
                const SizedBox(height: 8),
                TextButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Refresh')),
              ],
            ),
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(onPressed: _showCreateDesk, icon: const Icon(Icons.add), label: const Text('Create desk')),
      );
    }
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 80),
          itemCount: _desks.length,
          itemBuilder: (context, i) {
            final raw = _desks[i];
            if (raw == null || raw is! Map) return const SizedBox.shrink();
            final d = Map<String, dynamic>.from(raw as Map);
            final name = d['name']?.toString() ?? 'Unnamed desk';
            final code = d['code']?.toString() ?? '';
            final id = d['id']?.toString();
            final count = (d['currentFileCount'] ?? (d['_count'] is Map ? (d['_count'] as Map)['files'] : 0)) as num?;
            final countInt = count != null ? count.toInt() : 0;
            final maxVal = d['maxFilesPerDay'] ?? d['optimumCapacity'];
            final max = (maxVal is num ? maxVal : 0).toInt();
            final deptMap = d['department'];
            final dept = deptMap is Map ? (deptMap as Map)['name']?.toString() : null;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.desktop_windows),
                title: Text(name),
                subtitle: Text([if (code.isNotEmpty) code, if (dept != null && dept.isNotEmpty) dept, '$countInt / $max files'].join(' • ')),
                trailing: id != null
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => _showEditDesk(d)),
                          IconButton(icon: Icon(Icons.delete_outline, color: theme.colorScheme.error), onPressed: () => _deleteDesk(d)),
                        ],
                      )
                    : null,
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDesk,
        icon: const Icon(Icons.add),
        label: const Text('Create desk'),
      ),
    );
  }
}

class _CreateDeskSheet extends StatefulWidget {
  const _CreateDeskSheet();

  @override
  State<_CreateDeskSheet> createState() => _CreateDeskSheetState();
}

class _CreateDeskSheetState extends State<_CreateDeskSheet> {
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  final _descController = TextEditingController();
  final _maxController = TextEditingController(text: '20');
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _divisions = [];
  String? _departmentId;
  String? _divisionId;
  bool _loading = false;
  bool _loadingDepts = true;

  @override
  void initState() {
    super.initState();
    _loadDepartments();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    _descController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    try {
      final res = await ApiClient().get<dynamic>('/departments');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) setState(() {
        _departments = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        if (_departments.isNotEmpty && _departmentId == null) {
          _departmentId = _departments.first['id'] as String?;
          _loadDivisions();
        }
        _loadingDepts = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingDepts = false);
    }
  }

  Future<void> _loadDivisions() async {
    if (_departmentId == null) {
      setState(() => _divisions = []);
      return;
    }
    try {
      final res = await ApiClient().get<dynamic>('/departments/$_departmentId/divisions');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) setState(() {
        _divisions = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _divisionId = _divisions.isNotEmpty ? _divisions.first['id'] as String? : null;
      });
    } catch (_) {
      if (mounted) setState(() => _divisions = []);
    }
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty || _codeController.text.trim().isEmpty || _departmentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name, code and department are required')));
      return;
    }
    final max = int.tryParse(_maxController.text.trim());
    if (max == null || max < 1) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid max files per day')));
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiClient().post('/desks', data: {
        'name': _nameController.text.trim(),
        'code': _codeController.text.trim(),
        'description': _descController.text.trim().isEmpty ? null : _descController.text.trim(),
        'departmentId': _departmentId,
        'divisionId': _divisionId,
        'maxFilesPerDay': max,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Desk created')));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = MediaQuery.of(context).viewPadding;
    return Padding(
      padding: EdgeInsets.only(bottom: padding.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Create desk', style: theme.textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _codeController,
              decoration: const InputDecoration(labelText: 'Code', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _maxController,
              decoration: const InputDecoration(labelText: 'Max files per day', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            if (_loadingDepts)
              const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
            else ...[
              DropdownButtonFormField<String>(
                value: _departmentId,
                decoration: const InputDecoration(labelText: 'Department', border: OutlineInputBorder()),
                items: _departments.map((d) => DropdownMenuItem(value: d['id'] as String?, child: Text(d['name'] as String? ?? ''))).toList(),
                onChanged: (v) {
                  setState(() {
                    _departmentId = v;
                    _loadDivisions();
                  });
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _divisionId,
                decoration: const InputDecoration(labelText: 'Division (optional)', border: OutlineInputBorder()),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None')),
                  ..._divisions.map((d) => DropdownMenuItem(value: d['id'] as String?, child: Text(d['name'] as String? ?? ''))),
                ],
                onChanged: (v) => setState(() => _divisionId = v),
              ),
            ],
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel'))),
                const SizedBox(width: 16),
                Expanded(child: FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create'))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EditDeskSheet extends StatefulWidget {
  final Map<String, dynamic> desk;

  const _EditDeskSheet({required this.desk});

  @override
  State<_EditDeskSheet> createState() => _EditDeskSheetState();
}

class _EditDeskSheetState extends State<_EditDeskSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _descController;
  late final TextEditingController _maxController;
  bool _loading = false;
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.desk['name']?.toString() ?? '');
    _descController = TextEditingController(text: widget.desk['description']?.toString() ?? '');
    _maxController = TextEditingController(text: (widget.desk['maxFilesPerDay'] ?? 20).toString());
    _isActive = widget.desk['isActive'] != false;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name is required')));
      return;
    }
    final max = int.tryParse(_maxController.text.trim());
    if (max == null || max < 1) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid max files per day')));
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiClient().patch('/desks/${widget.desk['id']}', data: {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim().isEmpty ? null : _descController.text.trim(),
        'maxFilesPerDay': max,
        'isActive': _isActive,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Desk updated')));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = MediaQuery.of(context).viewPadding;
    return Padding(
      padding: EdgeInsets.only(bottom: padding.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Edit desk', style: theme.textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _maxController,
              decoration: const InputDecoration(labelText: 'Max files per day', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel'))),
                const SizedBox(width: 16),
                Expanded(child: FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
