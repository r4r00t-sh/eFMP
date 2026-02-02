import 'package:flutter_test/flutter_test.dart';
import 'package:efiling_app/models/file_model.dart';

void main() {
  group('FileModel', () {
    test('fromJson parses minimal valid JSON', () {
      final json = {
        'id': 'f1',
        'fileNumber': 'F/2024/001',
        'subject': 'Test file',
        'status': 'PENDING',
        'priority': 'NORMAL',
      };
      final f = FileModel.fromJson(json);
      expect(f.id, 'f1');
      expect(f.fileNumber, 'F/2024/001');
      expect(f.subject, 'Test file');
      expect(f.status, 'PENDING');
      expect(f.priority, 'NORMAL');
      expect(f.description, isNull);
      expect(f.isRedListed, false);
      expect(f.isOnHold, false);
      expect(f.isRecalled, false);
      expect(f.isClosed, false);
      expect(f.notes, isEmpty);
      expect(f.routingHistory, isEmpty);
      expect(f.attachments, isEmpty);
    });

    test('fromJson uses defaults for missing status/priority', () {
      final json = {'id': 'f2', 'fileNumber': 'F2', 'subject': 'S2'};
      final f = FileModel.fromJson(json);
      expect(f.status, 'PENDING');
      expect(f.priority, 'NORMAL');
    });

    test('fromJson parses optional fields', () {
      final json = {
        'id': 'f3',
        'fileNumber': 'F3',
        'subject': 'S3',
        'description': 'Desc',
        'isRedListed': true,
        'isOnHold': true,
        'dueDate': '2024-12-31T00:00:00.000Z',
        'department': {'name': 'Admin'},
      };
      final f = FileModel.fromJson(json);
      expect(f.description, 'Desc');
      expect(f.isRedListed, true);
      expect(f.isOnHold, true);
      expect(f.dueDate, isNotNull);
      expect(f.departmentName, 'Admin');
    });

    test('departmentName returns empty when department is null', () {
      final json = {'id': 'f4', 'fileNumber': 'F4', 'subject': 'S4'};
      final f = FileModel.fromJson(json);
      expect(f.departmentName, '');
    });
  });

  group('FileNoteModel', () {
    test('fromJson parses note and userName', () {
      final json = {
        'id': 'n1',
        'content': 'A note',
        'createdAt': '2024-01-01T00:00:00.000Z',
        'user': {'name': 'John'},
      };
      final n = FileNoteModel.fromJson(json);
      expect(n.id, 'n1');
      expect(n.content, 'A note');
      expect(n.userName, 'John');
    });

    test('userName returns em dash when user is null', () {
      final json = {'id': 'n2', 'content': 'Note'};
      final n = FileNoteModel.fromJson(json);
      expect(n.userName, '—');
    });
  });

  group('RoutingEntryModel', () {
    test('fromJson parses action and remarks', () {
      final json = {
        'id': 'r1',
        'action': 'FORWARD',
        'remarks': 'Sent to division',
      };
      final r = RoutingEntryModel.fromJson(json);
      expect(r.id, 'r1');
      expect(r.action, 'FORWARD');
      expect(r.remarks, 'Sent to division');
    });
  });

  group('FileAttachmentModel', () {
    test('fromJson parses attachment fields', () {
      final json = {
        'id': 'a1',
        'filename': 'doc.pdf',
        'mimeType': 'application/pdf',
        'size': 1024,
        'url': 'https://example.com/doc.pdf',
      };
      final a = FileAttachmentModel.fromJson(json);
      expect(a.id, 'a1');
      expect(a.filename, 'doc.pdf');
      expect(a.mimeType, 'application/pdf');
      expect(a.size, 1024);
      expect(a.url, 'https://example.com/doc.pdf');
    });

    test('fromJson uses defaults for missing optional fields', () {
      final json = {'id': 'a2', 'url': '/file'};
      final a = FileAttachmentModel.fromJson(json);
      expect(a.filename, 'file');
      expect(a.mimeType, 'application/octet-stream');
      expect(a.size, 0);
    });
  });
}
