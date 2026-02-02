import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/auth/auth_provider.dart';
import 'package:efiling_app/core/widgets/user_avatar.dart';

/// Create group conversation: name, description, department, members.
/// POST /chat/groups. Roles: SUPER_ADMIN, DEPT_ADMIN, CHAT_MANAGER.
class ChatCreateGroupScreen extends StatefulWidget {
  const ChatCreateGroupScreen({super.key});

  @override
  State<ChatCreateGroupScreen> createState() => _ChatCreateGroupScreenState();
}

class _ChatCreateGroupScreenState extends State<ChatCreateGroupScreen> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  String? _departmentId;
  final Set<String> _memberIds = {};
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _users = [];
  bool _loadingDepts = false;
  bool _loadingUsers = false;
  bool _submitting = false;
  String? _error;

  static const _groupCreatorRoles = ['SUPER_ADMIN', 'DEPT_ADMIN', 'CHAT_MANAGER'];

  @override
  void initState() {
    super.initState();
    _loadDepartments();
    _loadUsers();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    setState(() => _loadingDepts = true);
    try {
      final res = await ApiClient().get<dynamic>('/departments');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) setState(() {
        _departments = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _loadingDepts = false;
      });
    } catch (_) {
      if (mounted) setState(() { _departments = []; _loadingDepts = false; });
    }
  }

  Future<void> _loadUsers() async {
    setState(() => _loadingUsers = true);
    try {
      final res = await ApiClient().get<dynamic>('/chat/users');
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) setState(() {
        _users = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _loadingUsers = false;
      });
    } catch (_) {
      if (mounted) setState(() { _users = []; _loadingUsers = false; });
    }
  }

  bool _canCreateGroup(String? primaryRole) {
    if (primaryRole == null) return false;
    return _groupCreatorRoles.contains(primaryRole);
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Enter group name');
      return;
    }
    setState(() { _error = null; _submitting = true; });
    try {
      final res = await ApiClient().post<Map<String, dynamic>>('/chat/groups', data: {
        'name': name,
        if (_descController.text.trim().isNotEmpty) 'description': _descController.text.trim(),
        if (_departmentId != null && _departmentId!.isNotEmpty) 'departmentId': _departmentId,
        'memberIds': _memberIds.toList(),
      });
      if (mounted) {
        context.pop();
        final id = res.data?['id']?.toString();
        if (id != null && id.isNotEmpty) {
          context.push('/chat/$id');
        } else {
          context.push('/chat');
        }
      }
    } catch (e) {
      if (mounted) setState(() {
        _submitting = false;
        _error = e.toString().replaceFirst('DioException: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final primaryRole = user?.primaryRole;
    final canCreate = _canCreateGroup(primaryRole);

    if (!canCreate) {
      return Scaffold(
        appBar: AppBar(title: const Text('Create Group')),
        body: const Center(child: Text('Only admins or chat managers can create groups.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Create Group')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Group name *',
                border: OutlineInputBorder(),
                hintText: 'e.g. Finance Team',
              ),
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() => _error = null),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
                border: OutlineInputBorder(),
                hintText: 'Short description of the group',
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            if (_loadingDepts)
              const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
            else if (_departments.isNotEmpty)
              DropdownButtonFormField<String>(
                value: _departmentId,
                decoration: const InputDecoration(labelText: 'Department (optional)', border: OutlineInputBorder()),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None')),
                  ..._departments.map((d) {
                    final id = d['id']?.toString();
                    final name = d['name']?.toString() ?? id ?? '';
                    return DropdownMenuItem(value: id, child: Text(name));
                  }),
                ],
                onChanged: (v) => setState(() => _departmentId = v),
              ),
            const SizedBox(height: 24),
            Text('Members', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            if (_loadingUsers)
              const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
            else
              ..._users.map((u) {
                final id = u['id']?.toString() ?? '';
                final name = u['name']?.toString() ?? u['username']?.toString() ?? id;
                final selected = _memberIds.contains(id);
                return CheckboxListTile(
                  value: selected,
                  onChanged: (v) => setState(() {
                    if (v == true) _memberIds.add(id); else _memberIds.remove(id);
                  }),
                  secondary: UserAvatar(userId: id, name: name, radius: 20),
                  title: Text(name),
                  controlAffinity: ListTileControlAffinity.leading,
                );
              }),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.group_add),
              label: Text(_submitting ? 'Creating...' : 'Create Group'),
            ),
          ],
        ),
      ),
    );
  }
}
