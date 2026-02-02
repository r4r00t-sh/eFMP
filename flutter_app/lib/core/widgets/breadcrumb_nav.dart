import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Breadcrumb nav from current path (e.g. Home > Files > Inbox). Matches web BreadcrumbNav.
class BreadcrumbNav extends StatelessWidget {
  const BreadcrumbNav({super.key, required this.path, this.labelOverrides});

  /// Current route path, e.g. /files/inbox or /admin/users/abc-123
  final String path;

  /// Optional map of path segment -> display label (e.g. 'inbox' -> 'File Inbox')
  final Map<String, String>? labelOverrides;

  static String _segmentToLabel(String segment) {
    if (segment.isEmpty) return segment;
    final overrides = _defaultLabels;
    final lower = segment.toLowerCase();
    if (overrides.containsKey(lower)) return overrides[lower]!;
    if (segment.length > 20 && (segment.contains('-') || RegExp(r'^[a-f0-9-]+$').hasMatch(segment))) {
      return 'Detail';
    }
    return segment.split('-').map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1).toLowerCase()).join(' ');
  }

  static const Map<String, String> _defaultLabels = {
    'files': 'Files',
    'inbox': 'Inbox',
    'new': 'New File',
    'track': 'Track Files',
    'approvals': 'Approvals',
    'admin': 'Admin',
    'users': 'Users',
    'desk': 'Active Desk',
    'desks': 'Desk Capacity',
    'documents': 'Documents',
    'recall': 'Recall',
    'workflows': 'Workflows',
    'analytics': 'Analytics',
    'dispatch': 'Dispatch',
    'history': 'History',
    'chat': 'Chat',
    'opinions': 'Opinions',
    'dashboard': 'Dashboard',
    'profile': 'Profile',
    'settings': 'Settings',
    'builder': 'Workflow Builder',
  };

  @override
  Widget build(BuildContext context) {
    if (path == '/login' || path == '/' || path.isEmpty) return const SizedBox.shrink();

    final segments = path.split('/').where((s) => s.isNotEmpty).toList();
    if (segments.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final overrides = labelOverrides ?? {};

    String labelFor(String segment) {
      final lower = segment.toLowerCase();
      return overrides[lower] ?? _segmentToLabel(segment);
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            iconSize: 20,
            onPressed: () => context.go('/dashboard'),
            tooltip: 'Home',
            style: IconButton.styleFrom(
              foregroundColor: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 4),
          ...List.generate(segments.length * 2 - 1, (i) {
            if (i.isOdd) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Icon(Icons.chevron_right, size: 18, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
              );
            }
            final idx = i ~/ 2;
            final segment = segments[idx];
            final href = '/' + segments.sublist(0, idx + 1).join('/');
            final isLast = idx == segments.length - 1;
            final label = labelFor(segment);

            if (isLast) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Text(
                  label,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            }
            return InkWell(
              onTap: () => context.go(href),
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
