import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/widgets/user_avatar.dart';

/// Pick a user to start a new DM. Calls GET /chat/users and POST /chat/dm/:otherUserId.
class ChatUserPickerScreen extends StatefulWidget {
  const ChatUserPickerScreen({super.key});

  @override
  State<ChatUserPickerScreen> createState() => _ChatUserPickerScreenState();
}

class _ChatUserPickerScreenState extends State<ChatUserPickerScreen> {
  List<dynamic> _users = [];
  bool _loading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<dynamic>('/chat/users');
      final data = res.data;
      _users = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
    } catch (_) {
      _users = [];
    }
    if (mounted) setState(() => _loading = false);
  }

  List<dynamic> get _filteredUsers {
    final q = _searchController.text.trim().toLowerCase();
    if (q.isEmpty) return _users;
    return _users.where((u) {
      final map = u is Map ? u as Map<String, dynamic> : <String, dynamic>{};
      final name = (map['name']?.toString() ?? '').toLowerCase();
      final username = (map['username']?.toString() ?? '').toLowerCase();
      return name.contains(q) || username.contains(q);
    }).toList();
  }

  Future<void> _startDm(String otherUserId) async {
    try {
      final res = await ApiClient().post<dynamic>('/chat/dm/$otherUserId');
      final data = res.data;
      final convId = data is Map ? (data['id']?.toString() ?? '') : '';
      if (convId.isNotEmpty && mounted) {
        context.go('/chat/$convId');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not start chat: ${e.toString().replaceFirst('DioException: ', '')}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('New chat'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name or username…',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filteredUsers.isEmpty
                    ? Center(
                        child: Text(
                          _searchController.text.trim().isEmpty ? 'No users to chat with' : 'No users match your search',
                          style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _filteredUsers.length,
                        itemBuilder: (context, i) {
                          final u = _filteredUsers[i] is Map ? _filteredUsers[i] as Map<String, dynamic> : <String, dynamic>{};
                          final id = u['id']?.toString() ?? '';
                          final name = u['name']?.toString() ?? u['username']?.toString() ?? 'Unknown';
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: UserAvatar(userId: id, name: name, radius: 24),
                              title: Text(name),
                              subtitle: u['username'] != null ? Text(u['username'].toString()) : null,
                              trailing: const Icon(Icons.message),
                              onTap: () => _startDm(id),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
