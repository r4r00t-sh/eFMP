import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Bottom nav with blue band above, concave "dip" at the active item,
/// and a white circle that animates to the selected index (reference design).
class NotchedBottomNav extends StatefulWidget {
  const NotchedBottomNav({
    super.key,
    required this.selectedIndex,
    required this.itemCount,
    required this.children,
  });

  final int selectedIndex;
  final int itemCount;
  final List<Widget> children;

  @override
  State<NotchedBottomNav> createState() => _NotchedBottomNavState();
}

class _NotchedBottomNavState extends State<NotchedBottomNav>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  double _lastNotchX = 0;
  double _lastWidth = 0;
  int _lastSelectedIndex = -1;

  static const double _blueBandHeight = 24;
  static const double _barHeight = 64;
  static const double _notchRadius = 22;
  static const double _circleRadius = 24;
  static const double _circleCenterY = 32;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 280),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(NotchedBottomNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex &&
        _lastWidth > 0 &&
        widget.itemCount > 0) {
      final slotWidth = _lastWidth / widget.itemCount;
      final oldX = _lastNotchX;
      final newX = (widget.selectedIndex + 0.5) * slotWidth;
      _lastNotchX = newX;
      _lastSelectedIndex = widget.selectedIndex;
      _animation = Tween<double>(begin: oldX, end: newX).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
      );
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final surface = theme.colorScheme.surface;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final slotWidth = width / widget.itemCount;
        final targetNotchX = (widget.selectedIndex + 0.5) * slotWidth;
        if (width > 0) {
          _lastWidth = width;
          if (_lastSelectedIndex < 0) {
            _lastSelectedIndex = widget.selectedIndex;
            _lastNotchX = targetNotchX;
          }
        }

        return SizedBox(
          height: _barHeight + _blueBandHeight,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // 1. Blue band with concave dip (above the white bar)
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                height: _blueBandHeight + _notchRadius,
                child: AnimatedBuilder(
                  animation: _animation,
                  builder: (context, _) {
                    final notchX = _controller.isAnimating
                        ? _animation.value
                        : initialNotchX;
                    return CustomPaint(
                      size: Size(width, _blueBandHeight + _notchRadius),
                      painter: _BlueNotchPainter(
                        notchCenterX: x,
                        color: primary,
                        notchRadius: _notchRadius,
                        bandHeight: _blueBandHeight,
                      ),
                    );
                  },
                ),
              ),
              // 2. White bar with circular cut-out for the active item
              Positioned(
                left: 0,
                right: 0,
                top: _blueBandHeight - 8,
                height: _barHeight,
                child: AnimatedBuilder(
                  animation: _animation,
                  builder: (context, _) {
                    final x = _controller.isAnimating
                        ? _animation.value
                        : _lastNotchX;
                    return CustomPaint(
                      size: Size(width, _barHeight),
                      painter: _WhiteBarWithHolePainter(
                        holeCenterX: x,
                        holeCenterY: _circleCenterY,
                        holeRadius: _circleRadius,
                        color: surface,
                      ),
                    );
                  },
                ),
              ),
              // 3. White circle that sits in the dip (animates with notch)
              AnimatedBuilder(
                animation: _animation,
                builder: (context, _) {
                  final x = _controller.isAnimating
                      ? _animation.value
                      : _lastNotchX;
                  return Positioned(
                    left: x - _circleRadius,
                    top: _blueBandHeight - 8 + _circleCenterY - _circleRadius,
                    child: Container(
                      width: _circleRadius * 2,
                      height: _circleRadius * 2,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: surface,
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.shadow.withOpacity( 0.12),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              // 4. Row of nav items on top
              Positioned(
                left: 0,
                right: 0,
                top: _blueBandHeight - 8,
                height: _barHeight,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: widget.children,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _BlueNotchPainter extends CustomPainter {
  _BlueNotchPainter({
    required this.notchCenterX,
    required this.color,
    required this.notchRadius,
    required this.bandHeight,
  });

  final double notchCenterX;
  final Color color;
  final double notchRadius;
  final double bandHeight;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(w, 0)
      ..lineTo(w, bandHeight)
      ..lineTo(notchCenterX + notchRadius, bandHeight)
      ..arcTo(
        Rect.fromCircle(Offset(notchCenterX, bandHeight + notchRadius), notchRadius),
        0,
        -math.pi,
        true,
      )
      ..lineTo(notchCenterX - notchRadius, bandHeight)
      ..lineTo(0, bandHeight)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_BlueNotchPainter old) =>
      old.notchCenterX != notchCenterX ||
      old.color != color ||
      old.notchRadius != notchRadius ||
      old.bandHeight != bandHeight;
}

class _WhiteBarWithHolePainter extends CustomPainter {
  _WhiteBarWithHolePainter({
    required this.holeCenterX,
    required this.holeCenterY,
    required this.holeRadius,
    required this.color,
  });

  final double holeCenterX;
  final double holeCenterY;
  final double holeRadius;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final rectPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final circlePath = Path()
      ..addOval(Rect.fromCircle(
        Offset(holeCenterX, holeCenterY),
        holeRadius,
      ));
    final path = Path.combine(PathOperation.difference, rectPath, circlePath);
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_WhiteBarWithHolePainter old) =>
      old.holeCenterX != holeCenterX ||
      old.holeCenterY != holeCenterY ||
      old.holeRadius != holeRadius ||
      old.color != color;
}
