import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart' show FormData, MultipartFile;
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/utils/responsive.dart';

class NewFileScreen extends StatefulWidget {
  const NewFileScreen({super.key});

  @override
  State<NewFileScreen> createState() => _NewFileScreenState();
}

class _NewFileScreenState extends State<NewFileScreen> {
  final _subjectController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _priority = 'NORMAL';
  String? _departmentId;
  String? _divisionId;
  DateTime? _dueDate;
  String? _templateId;
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _divisions = [];
  List<Map<String, dynamic>> _templates = [];
  List<PlatformFile> _pickedFiles = [];
  bool _loading = false;
  bool _departmentsLoaded = false;
  bool _loadingDivisions = false;

  @override
  void initState() {
    super.initState();
    _loadDepartments();
    _loadTemplates();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    try {
      final res = await ApiClient().get<dynamic>('/departments');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      setState(() {
        _departments = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        if (_departments.isNotEmpty && _departmentId == null) {
          _departmentId = _departments.first['id'] as String?;
          _loadDivisions();
        }
        _departmentsLoaded = true;
      });
    } catch (_) {}
  }

  Future<void> _loadDivisions() async {
    if (_departmentId == null) {
      setState(() {
        _divisions = [];
        _divisionId = null;
      });
      return;
    }
    setState(() => _loadingDivisions = true);
    try {
      final res = await ApiClient().get<dynamic>('/departments/$_departmentId/divisions');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      setState(() {
        _divisions = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _divisionId = _divisions.isNotEmpty ? _divisions.first['id'] as String? : null;
        _loadingDivisions = false;
      });
    } catch (_) {
      if (mounted) setState(() {
        _divisions = [];
        _divisionId = null;
        _loadingDivisions = false;
      });
    }
  }

  Future<void> _loadTemplates() async {
    try {
      final res = await ApiClient().get<dynamic>('/documents/templates');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      setState(() {
        _templates = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {}
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true, type: FileType.any);
    if (result == null || result.files.isEmpty) return;
    setState(() {
      _pickedFiles = List.from(_pickedFiles)..addAll(result.files.where((f) => f.name.isNotEmpty));
    });
  }

  void _removeFile(int index) {
    setState(() {
      _pickedFiles = List.from(_pickedFiles)..removeAt(index);
    });
  }

  void _applyTemplate(Map<String, dynamic> t) {
    setState(() {
      _templateId = t['id'] as String?;
      if (t['defaultSubject'] != null && (t['defaultSubject'] as String).isNotEmpty) {
        _subjectController.text = t['defaultSubject'] as String;
      }
      if (t['defaultDescription'] != null && (t['defaultDescription'] as String).isNotEmpty) {
        _descriptionController.text = t['defaultDescription'] as String;
      }
      if (t['defaultPriority'] != null && (t['defaultPriority'] as String).isNotEmpty) {
        _priority = t['defaultPriority'] as String;
      }
    });
  }

  Future<void> _submit() async {
    if (_subjectController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Subject is required')));
      return;
    }
    if (_departmentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Department is required')));
      return;
    }
    setState(() => _loading = true);
    try {
      if (_pickedFiles.isEmpty) {
        await ApiClient().post<Map<String, dynamic>>('/files', data: {
          'subject': _subjectController.text.trim(),
          'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          'priority': _priority,
          'departmentId': _departmentId,
          'divisionId': _divisionId,
          'dueDate': _dueDate != null ? _dueDate!.toIso8601String() : null,
        });
      } else {
        final formData = FormData.fromMap({
          'subject': _subjectController.text.trim(),
          'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          'priority': _priority,
          'departmentId': _departmentId,
          'divisionId': _divisionId,
          if (_dueDate != null) 'dueDate': _dueDate!.toIso8601String(),
        });
        for (final pf in _pickedFiles) {
          if (pf.bytes != null) {
            formData.files.add(MapEntry('files', MultipartFile.fromBytes(pf.bytes!, filename: pf.name)));
          } else if (pf.path != null && pf.path!.isNotEmpty) {
            formData.files.add(MapEntry('files', await MultipartFile.fromFile(pf.path!, filename: pf.name)));
          }
        }
        await ApiClient().dio.post<Map<String, dynamic>>('/files', data: formData);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File created successfully!')));
        context.go('/files/inbox');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = Responsive.padding(context);
    final maxW = Responsive.contentMaxWidth(context);

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 24),
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxW < double.infinity ? maxW : 600),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Create New File', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 24),
              if (_templates.isNotEmpty) ...[
                Text('Template (optional)', style: theme.textTheme.labelLarge),
                const SizedBox(height: 4),
                DropdownButtonFormField<String>(
                  value: _templateId,
                  decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Apply a template'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('None')),
                    ..._templates.map((t) {
                      final id = t['id'] as String?;
                      final name = t['name']?.toString() ?? 'Unnamed';
                      return DropdownMenuItem(
                        value: id,
                        child: Text(name),
                      );
                    }),
                  ],
                  onChanged: (v) {
                    setState(() => _templateId = v);
                    if (v != null) {
                      final t = _templates.cast<Map<String, dynamic>?>().firstWhere((e) => e!['id'] == v, orElse: () => null);
                      if (t != null) _applyTemplate(t);
                    }
                  },
                ),
                const SizedBox(height: 16),
              ],
              TextField(
                controller: _subjectController,
                decoration: const InputDecoration(labelText: 'Subject', hintText: 'File subject', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description (optional)', hintText: 'Details', border: OutlineInputBorder()),
                maxLines: 4,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: const InputDecoration(labelText: 'Priority', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'LOW', child: Text('Low')),
                  DropdownMenuItem(value: 'NORMAL', child: Text('Normal')),
                  DropdownMenuItem(value: 'HIGH', child: Text('High')),
                  DropdownMenuItem(value: 'URGENT', child: Text('Urgent')),
                ],
                onChanged: (v) => setState(() => _priority = v ?? 'NORMAL'),
              ),
              const SizedBox(height: 16),
              if (_departmentsLoaded)
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
              if (_departmentsLoaded) const SizedBox(height: 16),
              if (_loadingDivisions)
                const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Center(child: SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)))),
              if (!_loadingDivisions && _divisions.isNotEmpty) ...[
                DropdownButtonFormField<String>(
                  value: _divisionId,
                  decoration: const InputDecoration(labelText: 'Division (optional)', border: OutlineInputBorder()),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('None')),
                    ..._divisions.map((d) => DropdownMenuItem(value: d['id'] as String?, child: Text(d['name'] as String? ?? ''))),
                  ],
                  onChanged: (v) => setState(() => _divisionId = v),
                ),
                const SizedBox(height: 16),
              ],
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(_dueDate == null ? 'Due date (optional)' : 'Due: ${_dueDate!.year}-${_dueDate!.month.toString().padLeft(2, '0')}-${_dueDate!.day.toString().padLeft(2, '0')}'),
                trailing: IconButton(
                  icon: Icon(_dueDate == null ? Icons.calendar_today : Icons.clear),
                  onPressed: () async {
                    if (_dueDate != null) {
                      setState(() => _dueDate = null);
                      return;
                    }
                    final date = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365 * 2)));
                    if (date != null) setState(() => _dueDate = date);
                  },
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text('Attachments', style: theme.textTheme.titleSmall),
                  const SizedBox(width: 8),
                  FilledButton.tonalIcon(
                    icon: const Icon(Icons.add),
                    label: const Text('Add files'),
                    onPressed: _pickFiles,
                  ),
                ],
              ),
              if (_pickedFiles.isNotEmpty) ...[
                const SizedBox(height: 8),
                ...List.generate(_pickedFiles.length, (i) {
                  final f = _pickedFiles[i];
                  return ListTile(
                    dense: true,
                    leading: const Icon(Icons.insert_drive_file),
                    title: Text(f.name, overflow: TextOverflow.ellipsis),
                    trailing: IconButton(icon: const Icon(Icons.close), onPressed: () => _removeFile(i)),
                  );
                }),
                const SizedBox(height: 16),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: _loading ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create File'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
