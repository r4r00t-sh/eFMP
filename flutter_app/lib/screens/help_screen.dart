import 'package:flutter/material.dart';

/// Help center: FAQs, search, links. Matches web HelpCenter.
class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  final _expandedIndex = ValueNotifier<int?>(null);

  static const _faqs = [
    ('How do I create a new file?', 'Tap "Create New File" on the dashboard or go to Files > New. Fill in the details and upload attachments.'),
    ('How do I track a file?', 'Use Track File from the dashboard or menu. Enter the file number to see status and routing history.'),
    ('What are gamification points?', 'Points are earned by creating files, forwarding on time, and approving documents. They track your productivity.'),
    ('How do I forward a file?', 'Open the file details and tap "Forward". Select the destination desk or user, add notes, and confirm.'),
    ('What does "Red Listed" mean?', 'Red Listed files are overdue and need immediate attention. They show with a red indicator in your inbox.'),
    ('How do I get notifications?', 'Tap the bell icon in the app bar to open your notifications. You can mark them as read and open linked files.'),
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() => _query = _searchController.text));
  }

  @override
  void dispose() {
    _searchController.dispose();
    _expandedIndex.dispose();
    super.dispose();
  }

  List<(String, String)> get _filtered {
    if (_query.trim().isEmpty) return _faqs;
    final q = _query.toLowerCase();
    return _faqs.where((e) => e.$1.toLowerCase().contains(q) || e.$2.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final list = _filtered;
    return Scaffold(
      appBar: AppBar(title: const Text('Help Center')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search for help...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
              ),
            ),
          ),
          Expanded(
            child: list.isEmpty
                ? Center(child: Text('No results for "$_query"', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: list.length,
                    itemBuilder: (context, i) {
                      final (q, a) = list[i];
                      return ValueListenableBuilder<int?>(
                        valueListenable: _expandedIndex,
                        builder: (context, expanded, _) {
                          final isExpanded = expanded == i;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              onTap: () => _expandedIndex.value = isExpanded ? null : i,
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(child: Text(q, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600))),
                                        Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
                                      ],
                                    ),
                                    if (isExpanded) ...[
                                      const SizedBox(height: 12),
                                      Text(a, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
