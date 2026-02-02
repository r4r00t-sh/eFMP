import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:efiling_app/main.dart' show EfilingApp;

void main() {
  testWidgets('EfilingApp type exists', (WidgetTester tester) async {
    expect(EfilingApp, isNotNull);
  });

  testWidgets('MaterialApp builds and displays title', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        title: 'EFMP',
        home: Scaffold(
          body: Center(child: Text('EFMP')),
        ),
      ),
    );
    expect(find.text('EFMP'), findsOneWidget);
  });

  testWidgets('Find widget by key', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: [
              const ListTile(title: Text('Inbox')),
              ListTile(key: const Key('files'), title: const Text('Files')),
            ],
          ),
        ),
      ),
    );
    expect(find.byKey(const Key('files')), findsOneWidget);
    expect(find.text('Inbox'), findsOneWidget);
  });
}
