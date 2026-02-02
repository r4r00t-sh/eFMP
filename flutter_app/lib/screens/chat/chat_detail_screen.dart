import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:efiling_app/core/api/api_client.dart';
import 'package:provider/provider.dart';
import 'package:efiling_app/core/auth/auth_provider.dart';

/// Chat conversation detail: messages and send box (mirrors web /chat/[id]).
class ChatDetailScreen extends StatefulWidget {
  const ChatDetailScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  Map<String, dynamic>? _conversation;
  List<dynamic> _messages = [];
  bool _loading = true;
  String? _error;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final convRes = await ApiClient().get<dynamic>('/chat/conversations/${widget.conversationId}');
      final msgRes = await ApiClient().get<dynamic>('/chat/conversations/${widget.conversationId}/messages', queryParameters: {'limit': '50'});
      if (mounted) {
        setState(() {
          _conversation = convRes.data is Map ? Map<String, dynamic>.from(convRes.data as Map) : null;
          final msgData = msgRes.data;
          if (msgData is List) {
            _messages = List<dynamic>.from(msgData);
          } else if (msgData is Map && msgData['messages'] is List) {
            _messages = List<dynamic>.from(msgData['messages'] as List);
          } else {
            _messages = [];
          }
          _loading = false;
        });
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

  /// For DM, return the other user's name; otherwise null.
  String? _dmOtherUserName(Map<String, dynamic>? conv, String currentUserId) {
    if (conv == null) return null;
    if ((conv['type']?.toString() ?? '') != 'DM') return null;
    final members = conv['members'];
    if (members is! List) return null;
    for (final m in members) {
      final member = m is Map ? m as Map<String, dynamic> : <String, dynamic>{};
      if ((member['userId']?.toString() ?? '') != currentUserId) {
        final user = member['user'];
        if (user is Map) return user['name']?.toString() ?? user['username']?.toString();
        return null;
      }
    }
    return null;
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;
    try {
      await ApiClient().post<dynamic>(
        '/chat/conversations/${widget.conversationId}/messages',
        data: {'content': content},
      );
      _messageController.clear();
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final currentUserId = auth.user?.id ?? '';

    if (_loading && _conversation == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null && _conversation == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chat')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
                const SizedBox(height: 16),
                Text('Failed to load conversation', style: theme.textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
                const SizedBox(height: 24),
                FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
                const SizedBox(height: 8),
                TextButton(onPressed: () => context.go('/chat'), child: const Text('Back to Chats')),
              ],
            ),
          ),
        ),
      );
    }

    final name = _dmOtherUserName(_conversation, currentUserId) ?? _conversation?['name']?.toString() ?? 'Chat';

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/chat'),
        ),
        title: Text(name),
      ),
      body: Column(
        children: [
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: _messages.isEmpty
                  ? ListView(
                      children: [
                        const SizedBox(height: 48),
                        Center(
                          child: Text(
                            'No messages yet',
                            style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) {
                        final m = _messages[i] is Map ? _messages[i] as Map<String, dynamic> : <String, dynamic>{};
                        final senderId = m['senderId']?.toString() ?? '';
                        final content = m['content']?.toString() ?? '';
                        final isMe = senderId == currentUserId;
                        return Align(
                          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isMe ? theme.colorScheme.primaryContainer : theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            child: Text(content, style: theme.textTheme.bodyMedium),
                          ),
                        );
                      },
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message…',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    maxLines: 2,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
