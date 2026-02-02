import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:efiling_app/core/api/api_client.dart';

/// Displays user avatar by fetching GET /users/:id/avatar (with auth).
/// Falls back to initials CircleAvatar if no avatar or fetch fails.
class UserAvatar extends StatefulWidget {
  const UserAvatar({
    super.key,
    required this.userId,
    required this.name,
    this.radius = 20,
    this.backgroundColor,
    this.foregroundColor,
    this.fontSize,
  });

  final String userId;
  final String name;
  final double radius;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? fontSize;

  @override
  State<UserAvatar> createState() => _UserAvatarState();
}

class _UserAvatarState extends State<UserAvatar> {
  Uint8List? _bytes;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(UserAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId) {
      _bytes = null;
      _loaded = false;
      _load();
    }
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().dio.get<dynamic>(
        '/users/${widget.userId}/avatar',
        options: Options(responseType: ResponseType.bytes),
      );
      if (res.data != null && mounted) {
        final raw = res.data;
        final bytes = raw is Uint8List
            ? raw
            : (raw is List<int> ? Uint8List.fromList(raw) : null);
        if (bytes != null && bytes.isNotEmpty) {
          setState(() {
            _bytes = bytes;
            _loaded = true;
          });
        } else {
          setState(() => _loaded = true);
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loaded = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bg = widget.backgroundColor ?? theme.colorScheme.primary;
    final fg = widget.foregroundColor ?? theme.colorScheme.onPrimary;
    final initials = widget.name.isNotEmpty ? widget.name[0].toUpperCase() : '?';
    final fontSize = widget.fontSize ?? (widget.radius * 0.8);

    if (_bytes != null && _bytes!.isNotEmpty) {
      return CircleAvatar(
        radius: widget.radius,
        backgroundImage: MemoryImage(_bytes!),
      );
    }
    return CircleAvatar(
      radius: widget.radius,
      backgroundColor: bg,
      child: Text(
        initials,
        style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: fontSize),
      ),
    );
  }
}
