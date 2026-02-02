import 'package:flutter/material.dart';
import 'package:efiling_app/core/api/api_client.dart';

/// Recall Protocol: recall a file by ID (mirrors web /admin/recall).
class RecallScreen extends StatefulWidget {
  const RecallScreen({super.key});

  @override
  State<RecallScreen> createState() => _RecallScreenState();
}

class _RecallScreenState extends State<RecallScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  String? _message;
  bool _success = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _recall() async {
    final fileId = _controller.text.trim();
    if (fileId.isEmpty) {
      setState(() {
        _message = 'Enter a file ID or file number';
        _success = false;
      });
      return;
    }
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await ApiClient().post<dynamic>('/files/$fileId/recall');
      if (mounted) {
        setState(() {
          _loading = false;
          _message = 'File recalled successfully.';
          _success = true;
          _controller.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _message = e.toString().replaceFirst('DioException: ', '');
          _success = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recall Protocol', style: theme.textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Recall a file from the system by file ID or file number. Use only in exceptional circumstances.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('File to recall', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'File ID or file number',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.pin_drop),
                    ),
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _recall(),
                  ),
                  const SizedBox(height: 16),
                  if (_message != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Material(
                        color: _success ? theme.colorScheme.primaryContainer : theme.colorScheme.errorContainer,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(_message!, style: theme.textTheme.bodyMedium?.copyWith(color: _success ? theme.colorScheme.onPrimaryContainer : theme.colorScheme.onErrorContainer)),
                        ),
                      ),
                    ),
                  FilledButton.icon(
                    onPressed: _loading ? null : _recall,
                    icon: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.warning_amber),
                    label: Text(_loading ? 'Recalling…' : 'Recall file'),
                    style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
