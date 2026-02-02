import 'package:flutter/material.dart';
import 'package:efiling_app/core/theme/app_spacing.dart';

/// Skeleton placeholder for loading states (better perceived speed than spinners).
/// Use for lists, cards, and content blocks.
class SkeletonLoader extends StatefulWidget {
  const SkeletonLoader({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
  });

  final double? width;
  final double? height;
  final BorderRadius? borderRadius;

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: 0.3, end: 0.7).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = theme.colorScheme.onSurface.withValues(alpha: 0.08);
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(AppSpacing.xs),
            color: color.withValues(alpha: _animation.value),
          ),
        );
      },
    );
  }
}

/// Skeleton for dashboard stats grid (4 cards).
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonLoader(height: 28, width: 200),
          const SizedBox(height: AppSpacing.xs),
          SkeletonLoader(height: 20, width: double.infinity),
          const SizedBox(height: AppSpacing.sm),
          SkeletonLoader(height: 48, width: double.infinity),
          const SizedBox(height: AppSpacing.md),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: AppSpacing.sm,
            crossAxisSpacing: AppSpacing.sm,
            childAspectRatio: 1.4,
            children: List.generate(4, (_) => const SkeletonLoader()),
          ),
          const SizedBox(height: AppSpacing.md),
          SkeletonLoader(height: 24, width: 140),
          const SizedBox(height: AppSpacing.xs),
          ...List.generate(3, (_) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: SkeletonLoader(height: 72, width: double.infinity),
          )),
        ],
      ),
    );
  }
}

/// Skeleton for a list of list tiles (e.g. inbox).
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key, this.itemCount = 5});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.sm),
      itemCount: itemCount,
      itemBuilder: (_, __) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Row(
          children: [
            const SkeletonLoader(width: 48, height: 48),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonLoader(height: 16, width: double.infinity),
                  const SizedBox(height: AppSpacing.xxs),
                  SkeletonLoader(height: 12, width: 120),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
