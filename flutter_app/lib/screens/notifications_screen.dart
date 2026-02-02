import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:efiling_app/core/api/api_client.dart';

/// Notification center: list notifications, mark as read, open linked file.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  bool _includeRead = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get<dynamic>(
        '/notifications',
        queryParameters: {'includeRead': _includeRead.toString()},
      );
      final data = res.data;
      final list = data is List ? data : (data is Map && data['data'] != null ? data['data'] as List : []);
      if (mounted) {
        setState(() {
          _notifications = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await ApiClient().post('/notifications/$id/read');
      if (mounted) {
        setState(() {
          final i = _notifications.indexWhere((n) => n['id'] == id);
          if (i >= 0) _notifications[i]['isRead'] = true;
        });
      }
    } catch (_) {}
  }

  Future<void> _markAllAsRead() async {
    try {
      await ApiClient().post('/notifications/mark-all-read');
      if (mounted) {
        setState(() {
          for (var n in _notifications) n['isRead'] = true;
        });
      }
    } catch (_) {}
  }

  int get _unreadCount => _notifications.where((n) => n['isRead'] != true).length;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            icon: Icon(_includeRead ? Icons.check_circle : Icons.radio_button_unchecked),
            tooltip: _includeRead ? 'Showing all' : 'Unread only',
            onPressed: () {
              setState(() {
                _includeRead = !_includeRead;
                _load();
              });
            },
          ),
          if (_unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllAsRead,
              icon: const Icon(Icons.done_all, size: 20),
              label: const Text('Mark all read'),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      Text('No notifications', style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _notifications.length,
                    itemBuilder: (context, i) {
                      final n = _notifications[i];
                      final id = n['id'] as String?;
                      final isRead = n['isRead'] == true;
                      final title = n['title']?.toString() ?? '';
                      final message = n['message']?.toString() ?? '';
                      final type = n['type']?.toString() ?? 'system';
                      final fileId = n['fileId']?.toString();
                      final createdAt = n['createdAt']?.toString();
                      return Material(
                        color: isRead ? null : theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
                        child: ListTile(
                          leading: _iconForType(type, theme),
                          title: Text(title, style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.w600)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (message.isNotEmpty) Text(message, maxLines: 2, overflow: TextOverflow.ellipsis),
                              if (createdAt != null && createdAt.isNotEmpty)
                                Text(
                                  _formatDate(createdAt),
                                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                            ],
                          ),
                          isThreeLine: true,
                          onTap: () async {
                            if (id != null && !isRead) await _markAsRead(id);
                            if (fileId != null && fileId.isNotEmpty) {
                              if (context.mounted) context.push('/files/$fileId');
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _iconForType(String type, ThemeData theme) {
    IconData icon;
    switch (type) {
      case 'file':
        icon = Icons.description;
        break;
      case 'chat':
        icon = Icons.chat_bubble_outline;
        break;
      case 'user':
        icon = Icons.person_outline;
        break;
      default:
        icon = Icons.notifications_outlined;
    }
    return Icon(icon, color: theme.colorScheme.primary);
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      final now = DateTime.now();
      if (d.year == now.year && d.month == now.month && d.day == now.day) {
        return DateFormat.Hm().format(d);
      }
      return DateFormat.MMMd().format(d);
    } catch (_) {
      return iso;
    }
  }
}
