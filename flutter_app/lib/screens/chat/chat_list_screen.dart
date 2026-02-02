import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:efiling_app/core/auth/auth_provider.dart';
import 'package:efiling_app/core/widgets/user_avatar.dart';

const _groupCreatorRoles = ['SUPER_ADMIN', 'DEPT_ADMIN', 'CHAT_MANAGER'];

/// Lists users you chatted with recently (DMs show the other person's name and avatar).
/// Tap a user to open the DM. "New chat" opens a user picker to start a DM with someone new.
class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  List<dynamic> _conversations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<dynamic>('/chat/conversations');
      final data = res.data;
      _conversations = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  /// For a conversation, get display name and other user id (for DM) or null (for group).
  ({String displayName, String? otherUserId, String? otherUserName}) _conversationDisplay(dynamic c, String currentUserId) {
    final map = c is Map ? c as Map<String, dynamic> : <String, dynamic>{};
    final type = map['type']?.toString() ?? '';
    final members = map['members'];
    if (type == 'DM' && members is List && members.length >= 2) {
      for (final m in members) {
        final member = m is Map ? m as Map<String, dynamic> : <String, dynamic>{};
        final userId = member['userId']?.toString() ?? '';
        if (userId != currentUserId) {
          final user = member['user'];
          final name = user is Map ? (user['name']?.toString() ?? user['username']?.toString() ?? 'Unknown') : 'Unknown';
          return (displayName: name, otherUserId: userId, otherUserName: name);
        }
      }
    }
    final name = map['name']?.toString();
    final displayName = (name != null && name.isNotEmpty) ? name : 'Group chat';
    return (displayName: displayName, otherUserId: null, otherUserName: null);
  }

  bool _canCreateGroup(String? primaryRole) =>
      primaryRole != null && _groupCreatorRoles.contains(primaryRole);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final currentUserId = auth.user?.id ?? '';
    final canCreateGroup = _canCreateGroup(auth.user?.primaryRole);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        actions: [
          if (canCreateGroup)
            IconButton(
              icon: const Icon(Icons.group_add),
              tooltip: 'Create group',
              onPressed: () => context.push('/chat/new/group'),
            ),
          IconButton(
            icon: const Icon(Icons.person_add),
            tooltip: 'New chat',
            onPressed: () => context.push('/chat/new'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _conversations.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 48),
                      Center(
                        child: Column(
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 64, color: theme.colorScheme.onSurfaceVariant),
                            const SizedBox(height: 16),
                            Text(
                              'No chats yet',
                              style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Tap "New chat" to message a colleague',
                              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            FilledButton.icon(
                              icon: const Icon(Icons.person_add, size: 20),
                              label: const Text('New chat'),
                              onPressed: () => context.push('/chat/new'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _conversations.length,
                    itemBuilder: (context, i) {
                      final c = _conversations[i];
                      final map = c is Map ? c as Map<String, dynamic> : <String, dynamic>{};
                      final id = map['id']?.toString() ?? '';
                      final info = _conversationDisplay(c, currentUserId);
                      final isDm = info.otherUserId != null;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: isDm && info.otherUserId != null && info.otherUserName != null
                              ? UserAvatar(
                                  userId: info.otherUserId!,
                                  name: info.otherUserName!,
                                  radius: 24,
                                )
                              : CircleAvatar(
                                  radius: 24,
                                  backgroundColor: theme.colorScheme.primaryContainer,
                                  child: Icon(Icons.group, color: theme.colorScheme.onPrimaryContainer),
                                ),
                          title: Text(info.displayName),
                          trailing: const Icon(Icons.arrow_forward),
                          onTap: () {
                            if (id.isNotEmpty) context.push('/chat/$id');
                          },
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
