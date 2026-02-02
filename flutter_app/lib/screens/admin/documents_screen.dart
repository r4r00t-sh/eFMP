import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart' show FormData, MultipartFile;
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/utils/responsive.dart';

/// Documents: templates and document management (mirrors web /admin/documents).
class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> with SingleTickerProviderStateMixin {
  List<dynamic> _templates = [];
  List<String> _categories = [];
  String? _categoryFilter;
  bool _loading = true;
  String? _error;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
    _loadCategories();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get<dynamic>('/documents/templates', queryParameters: _categoryFilter != null && _categoryFilter!.isNotEmpty ? {'category': _categoryFilter} : null);
      final data = res.data;
      if (data is List) {
        _templates = List<dynamic>.from(data);
      } else if (data is Map && data['data'] is List) {
        _templates = List<dynamic>.from(data['data'] as List);
      } else {
        _templates = [];
      }
    } catch (e) {
      _error = e.toString().replaceFirst('DioException: ', '');
      _templates = [];
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadCategories() async {
    try {
      final res = await ApiClient().get<dynamic>('/documents/templates-categories');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) setState(() {
        _categories = list.map((e) => e.toString()).toList();
      });
    } catch (_) {}
  }

  void _showCreateTemplate() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => const _CreateTemplateSheet(),
    );
    if (result == true && mounted) {
      _load();
      _loadCategories();
    }
  }

  void _showEditTemplate(Map<String, dynamic> template) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _EditTemplateSheet(template: template),
    );
    if (result == true && mounted) _load();
  }

  Future<void> _deleteTemplate(Map<String, dynamic> template) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete template'),
        content: Text('Delete template "${template['name'] ?? 'Unnamed'}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error), onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await ApiClient().delete('/documents/templates/${template['id']}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Template deleted')));
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'Templates', icon: Icon(Icons.description)), Tab(text: 'QR Scan', icon: Icon(Icons.qr_code_scanner))],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTemplatesTab(theme, padding),
              _buildQRTab(theme, padding),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTemplatesTab(ThemeData theme, EdgeInsets padding) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(padding.left),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load documents', style: theme.textTheme.titleLarge),
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
        padding: EdgeInsets.fromLTRB(padding.left, 16, padding.right, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text('Templates', style: theme.textTheme.headlineSmall)),
                FilledButton.tonalIcon(icon: const Icon(Icons.add), label: const Text('Create'), onPressed: _showCreateTemplate),
              ],
            ),
            const SizedBox(height: 8),
            if (_categories.isNotEmpty) ...[
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('All'),
                    selected: _categoryFilter == null || _categoryFilter!.isEmpty,
                    onSelected: (_) {
                      setState(() {
                        _categoryFilter = null;
                        _load();
                      });
                    },
                  ),
                  ..._categories.map((c) => ChoiceChip(
                        label: Text(c),
                        selected: _categoryFilter == c,
                        onSelected: (_) {
                          setState(() {
                            _categoryFilter = c;
                            _load();
                          });
                        },
                      )),
                ],
              ),
              const SizedBox(height: 16),
            ],
            if (_templates.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.description_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(height: 16),
                        Text('No templates yet', style: theme.textTheme.titleMedium),
                        Text('Create a template or change the category filter.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                        const SizedBox(height: 16),
                        FilledButton.icon(onPressed: _showCreateTemplate, icon: const Icon(Icons.add), label: const Text('Create template')),
                      ],
                    ),
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _templates.length,
                itemBuilder: (context, i) {
                  final t = _templates[i] is Map ? _templates[i] as Map<String, dynamic> : <String, dynamic>{};
                  final name = t['name']?.toString() ?? 'Unnamed template';
                  final category = t['category']?.toString() ?? '';
                  final id = t['id']?.toString();
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: const Icon(Icons.description),
                      title: Text(name),
                      subtitle: category.isNotEmpty ? Text(category) : null,
                      trailing: id != null
                          ? Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => _showEditTemplate(t)),
                                IconButton(icon: Icon(Icons.delete_outline, color: theme.colorScheme.error), onPressed: () => _deleteTemplate(t)),
                              ],
                            )
                          : null,
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildQRTab(ThemeData theme, EdgeInsets padding) {
    return _QRScanTab(padding: padding);
  }
}

class _CreateTemplateSheet extends StatefulWidget {
  const _CreateTemplateSheet();

  @override
  State<_CreateTemplateSheet> createState() => _CreateTemplateSheetState();
}

class _CreateTemplateSheetState extends State<_CreateTemplateSheet> {
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  final _descController = TextEditingController();
  final _categoryController = TextEditingController();
  final _defaultSubjectController = TextEditingController();
  final _defaultDescriptionController = TextEditingController();
  final _defaultDueDaysController = TextEditingController();
  PlatformFile? _pickedFile;
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    _descController.dispose();
    _categoryController.dispose();
    _defaultSubjectController.dispose();
    _defaultDescriptionController.dispose();
    _defaultDueDaysController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: false, type: FileType.any);
    if (result != null && result.files.isNotEmpty) setState(() => _pickedFile = result.files.first);
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty || _categoryController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name and category are required')));
      return;
    }
    setState(() => _loading = true);
    try {
      final formData = FormData.fromMap({
        'name': _nameController.text.trim(),
        'code': _codeController.text.trim().isEmpty ? _nameController.text.trim().replaceAll(RegExp(r'\s+'), '_') : _codeController.text.trim(),
        'description': _descController.text.trim().isEmpty ? null : _descController.text.trim(),
        'category': _categoryController.text.trim(),
        'defaultSubject': _defaultSubjectController.text.trim().isEmpty ? null : _defaultSubjectController.text.trim(),
        'defaultDescription': _defaultDescriptionController.text.trim().isEmpty ? null : _defaultDescriptionController.text.trim(),
        'defaultDueDays': _defaultDueDaysController.text.trim().isEmpty ? null : _defaultDueDaysController.text.trim(),
      });
      if (_pickedFile != null && (_pickedFile!.bytes != null || (_pickedFile!.path != null && _pickedFile!.path!.isNotEmpty))) {
        if (_pickedFile!.bytes != null) {
          formData.files.add(MapEntry('templateFile', MultipartFile.fromBytes(_pickedFile!.bytes!, filename: _pickedFile!.name)));
        } else if (_pickedFile!.path != null && _pickedFile!.path!.isNotEmpty) {
          formData.files.add(MapEntry('templateFile', await MultipartFile.fromFile(_pickedFile!.path!, filename: _pickedFile!.name)));
        }
      }
      await ApiClient().dio.post('/documents/templates', data: formData);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Template created')));
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
            Text('Create template', style: theme.textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _codeController, decoration: const InputDecoration(labelText: 'Code (optional)', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _categoryController, decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _descController, decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()), maxLines: 2),
            const SizedBox(height: 12),
            TextField(controller: _defaultSubjectController, decoration: const InputDecoration(labelText: 'Default subject (optional)', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _defaultDescriptionController, decoration: const InputDecoration(labelText: 'Default description (optional)', border: OutlineInputBorder()), maxLines: 2),
            const SizedBox(height: 12),
            TextField(controller: _defaultDueDaysController, decoration: const InputDecoration(labelText: 'Default due days (optional)', border: OutlineInputBorder()), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_pickedFile?.name ?? 'Template file (optional)'),
              trailing: TextButton(onPressed: _pickFile, child: Text(_pickedFile == null ? 'Pick file' : 'Change')),
            ),
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

class _EditTemplateSheet extends StatefulWidget {
  final Map<String, dynamic> template;

  const _EditTemplateSheet({required this.template});

  @override
  State<_EditTemplateSheet> createState() => _EditTemplateSheetState();
}

class _EditTemplateSheetState extends State<_EditTemplateSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _descController;
  late final TextEditingController _categoryController;
  late final TextEditingController _defaultSubjectController;
  late final TextEditingController _defaultDescriptionController;
  final _defaultDueDaysController = TextEditingController();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.template['name']?.toString() ?? '');
    _descController = TextEditingController(text: widget.template['description']?.toString() ?? '');
    _categoryController = TextEditingController(text: widget.template['category']?.toString() ?? '');
    _defaultSubjectController = TextEditingController(text: widget.template['defaultSubject']?.toString() ?? '');
    _defaultDescriptionController = TextEditingController(text: widget.template['defaultDescription']?.toString() ?? '');
    _defaultDueDaysController.text = widget.template['defaultDueDays']?.toString() ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _categoryController.dispose();
    _defaultSubjectController.dispose();
    _defaultDescriptionController.dispose();
    _defaultDueDaysController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name is required')));
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiClient().patch('/documents/templates/${widget.template['id']}', data: {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim().isEmpty ? null : _descController.text.trim(),
        'category': _categoryController.text.trim().isEmpty ? null : _categoryController.text.trim(),
        'defaultSubject': _defaultSubjectController.text.trim().isEmpty ? null : _defaultSubjectController.text.trim(),
        'defaultDescription': _defaultDescriptionController.text.trim().isEmpty ? null : _defaultDescriptionController.text.trim(),
        'defaultDueDays': _defaultDueDaysController.text.trim().isEmpty ? null : int.tryParse(_defaultDueDaysController.text.trim()),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Template updated')));
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
    final padding = MediaQuery.of(context).viewPadding;
    return Padding(
      padding: EdgeInsets.only(bottom: padding.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Edit template', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _categoryController, decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _descController, decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()), maxLines: 2),
            const SizedBox(height: 12),
            TextField(controller: _defaultSubjectController, decoration: const InputDecoration(labelText: 'Default subject (optional)', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _defaultDescriptionController, decoration: const InputDecoration(labelText: 'Default description (optional)', border: OutlineInputBorder()), maxLines: 2),
            const SizedBox(height: 12),
            TextField(controller: _defaultDueDaysController, decoration: const InputDecoration(labelText: 'Default due days (optional)', border: OutlineInputBorder()), keyboardType: TextInputType.number),
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

class _QRScanTab extends StatefulWidget {
  final EdgeInsets padding;

  const _QRScanTab({required this.padding});

  @override
  State<_QRScanTab> createState() => _QRScanTabState();
}

class _QRScanTabState extends State<_QRScanTab> {
  final _qrDataController = TextEditingController();
  final _remarksController = TextEditingController();
  bool _loading = false;
  String? _lastResult;

  @override
  void dispose() {
    _qrDataController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _scan() async {
    final data = _qrDataController.text.trim();
    if (data.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter QR code data')));
      return;
    }
    setState(() {
      _loading = true;
      _lastResult = null;
    });
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/documents/qr/scan', data: {
        'qrCodeData': data,
        'remarks': _remarksController.text.trim().isEmpty ? null : _remarksController.text.trim(),
      });
      if (mounted) {
        setState(() {
          _loading = false;
          _lastResult = res.data?['message'] ?? 'Scanned successfully';
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_lastResult!)));
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _lastResult = 'Failed: $e';
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(widget.padding.left, 24, widget.padding.right, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Scan QR code', style: theme.textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Enter the QR code data (e.g. from a file QR) to log a scan.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 24),
          TextField(
            controller: _qrDataController,
            decoration: const InputDecoration(labelText: 'QR code data', hintText: 'EFILING-...', border: OutlineInputBorder()),
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _remarksController,
            decoration: const InputDecoration(labelText: 'Remarks (optional)', border: OutlineInputBorder()),
            maxLines: 2,
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            icon: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.qr_code_scanner),
            label: Text(_loading ? 'Scanning…' : 'Log scan'),
            onPressed: _loading ? null : _scan,
          ),
          if (_lastResult != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(_lastResult!, style: theme.textTheme.bodyMedium),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
