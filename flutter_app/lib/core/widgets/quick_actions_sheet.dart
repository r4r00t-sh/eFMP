import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Quick actions overlay (mobile equivalent of command palette).
/// Shows navigation shortcuts: Dashboard, Inbox, New File, Track File, Chat, Settings, Help.
void showQuickActionsSheet(BuildContext context) {
  final theme = Theme.of(context);
  final items = [
    (Icons.dashboard, 'Dashboard', '/dashboard'),
    (Icons.inbox, 'Inbox', '/files/inbox'),
    (Icons.add_box, 'New File', '/files/new'),
    (Icons.pin_drop, 'Track File', '/files/track'),
    (Icons.chat_bubble_outline, 'Chat', '/chat'),
    (Icons.notifications_outlined, 'Notifications', '/notifications'),
    (Icons.help_outline, 'Help', '/help'),
    (Icons.settings, 'Settings', '/settings'),
  ];
  showModalBottomSheet<void>(
    context: context,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Quick actions', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...items.map((e) => ListTile(
              leading: Icon(e.$1),
              title: Text(e.$2),
              onTap: () {
                Navigator.of(context).pop();
                context.push(e.$3);
              },
            )),
          ],
        ),
      ),
    ),
  );
}
