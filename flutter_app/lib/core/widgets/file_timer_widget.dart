import 'dart:async';
import 'package:flutter/material.dart';
import 'package:efiling_app/core/theme/app_colors.dart';

/// File timer: battery/clock style, live time remaining, priority category badge.
/// Matches web FileTimer + PriorityCategoryBadge.
class FileTimerWidget extends StatefulWidget {
  const FileTimerWidget({
    super.key,
    this.timerPercentage,
    this.deskArrivalTime,
    this.allottedTime,
    this.dueDate,
    this.isRedListed = false,
    this.isOnHold = false,
    this.priorityCategory,
    this.variant = FileTimerVariant.battery,
    this.showLabel = true,
  });

  final int? timerPercentage;
  final DateTime? deskArrivalTime;
  final int? allottedTime;
  final DateTime? dueDate;
  final bool isRedListed;
  final bool isOnHold;
  final String? priorityCategory;
  final FileTimerVariant variant;
  final bool showLabel;

  @override
  State<FileTimerWidget> createState() => _FileTimerWidgetState();
}

enum FileTimerVariant { battery, clock }

class _FileTimerWidgetState extends State<FileTimerWidget> {
  String _timeRemaining = '--:--:--';
  int _percentage = 100;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
  }

  @override
  void didUpdateWidget(FileTimerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.deskArrivalTime != widget.deskArrivalTime ||
        oldWidget.allottedTime != widget.allottedTime ||
        oldWidget.isOnHold != widget.isOnHold) {
      _updateRemaining();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _updateRemaining() {
    if (widget.isOnHold) {
      if (mounted) setState(() { _timeRemaining = 'On Hold'; _percentage = widget.timerPercentage ?? 100; });
      return;
    }
    final arrival = widget.deskArrivalTime;
    final allotted = widget.allottedTime;
    if (arrival == null || allotted == null || allotted <= 0) {
      if (mounted) setState(() { _timeRemaining = '--:--:--'; _percentage = widget.timerPercentage ?? 100; });
      return;
    }
    final now = DateTime.now();
    final elapsed = now.difference(arrival).inSeconds;
    final remaining = allotted - elapsed;
    if (remaining <= 0) {
      final overdue = -remaining;
      final days = overdue ~/ 86400;
      final hours = (overdue % 86400) ~/ 3600;
      final minutes = (overdue % 3600) ~/ 60;
      if (mounted) {
        setState(() {
          _percentage = 0;
          if (days > 0) {
            _timeRemaining = '-${days}d ${hours}h';
          } else {
            _timeRemaining = '-${hours}h ${minutes}m';
          }
        });
      }
      return;
    }
    final pct = ((remaining / allotted) * 100).round();
    final days = remaining ~/ 86400;
    final hours = (remaining % 86400) ~/ 3600;
    final minutes = (remaining % 3600) ~/ 60;
    final seconds = remaining % 60;
    String text;
    if (days > 0) {
      text = '${days}d ${hours}h';
    } else if (hours > 0) {
      text = '${hours}h ${minutes}m';
    } else if (minutes > 0) {
      text = '${minutes}m ${seconds}s';
    } else {
      text = '${seconds}s';
    }
    if (mounted) setState(() { _timeRemaining = text; _percentage = pct; });
  }

  String get _stateLabel {
    if (widget.isOnHold) return 'On Hold';
    if (widget.isRedListed || _percentage <= 0) return 'OVERDUE';
    return 'remaining';
  }

  Color _color(ThemeData theme) {
    if (widget.isOnHold) return theme.colorScheme.onSurfaceVariant;
    if (widget.isRedListed || _percentage <= 0) return AppColors.red;
    if (_percentage <= 10) return AppColors.red;
    if (_percentage <= 50) return AppColors.amber;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _color(theme);
    final isCritical = !widget.isOnHold && (_percentage <= 0 || widget.isRedListed);

    if (widget.variant == FileTimerVariant.clock) {
      return Card(
        color: color.withOpacity( 0.1),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(isCritical ? Icons.warning_amber : Icons.schedule, color: color, size: 24),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_timeRemaining, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: color, fontFeatures: [const FontFeature.tabularFigures()])),
                  if (widget.showLabel) Text(_stateLabel, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ],
          ),
        ),
      );
    }

    final pct = (_percentage / 100).clamp(0.0, 1.0);
    final fillWidth = 52.0 * pct;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 28,
          decoration: BoxDecoration(
            border: Border.all(color: color, width: 2),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Stack(
            clipBehavior: Clip.antiAlias,
            children: [
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                width: fillWidth,
                child: Container(
                  decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.horizontal(left: Radius.circular(4))),
                ),
              ),
              Center(
                child: Text(
                  widget.isOnHold ? '⏸' : '${_percentage.clamp(0, 100)}%',
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: _percentage > 50 ? Colors.white : color,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (widget.showLabel) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_timeRemaining, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: color)),
              Text(_stateLabel, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            ],
          ),
        ],
      ],
    );
  }
}

/// Priority category badge (ROUTINE, URGENT, etc.).
class PriorityCategoryBadge extends StatelessWidget {
  const PriorityCategoryBadge({super.key, required this.category});

  final String category;

  Color _color(BuildContext context) {
    final c = category.toUpperCase();
    if (c.contains('URGENT') || c.contains('HIGH')) return AppColors.red;
    if (c.contains('NORMAL') || c.contains('ROUTINE')) return Colors.green;
    return Theme.of(context).colorScheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _color(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity( 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity( 0.5)),
      ),
      child: Text(category, style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600, color: color)),
    );
  }
}
