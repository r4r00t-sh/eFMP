/// File model matching backend Prisma File and frontend usage.
class FileModel {
  final String id;
  final String fileNumber;
  final String subject;
  final String? description;
  final String status;
  final String priority;
  final String? priorityCategory;
  final String? departmentId;
  final Map<String, dynamic>? department;
  final String? createdById;
  final String? assignedToId;
  final bool isRedListed;
  final DateTime? dueDate;
  final DateTime? deskDueDate;
  final int? timeRemaining;
  final int? timerPercentage;
  final bool isOnHold;
  final bool isRecalled;
  final bool isClosed;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  // Detail payload from GET /files/:id
  final List<Map<String, dynamic>> notes;
  final List<Map<String, dynamic>> routingHistory;
  final List<Map<String, dynamic>> attachments;
  final Map<String, dynamic>? createdBy;
  final Map<String, dynamic>? assignedTo;
  final Map<String, dynamic>? currentDivision;
  final String? fileUrl;
  final String? s3Key;
  final String? holdReason;
  final DateTime? deskArrivalTime;
  final int? allottedTime;

  const FileModel({
    required this.id,
    required this.fileNumber,
    required this.subject,
    this.description,
    required this.status,
    required this.priority,
    this.priorityCategory,
    this.departmentId,
    this.department,
    this.createdById,
    this.assignedToId,
    this.isRedListed = false,
    this.dueDate,
    this.deskDueDate,
    this.timeRemaining,
    this.timerPercentage,
    this.isOnHold = false,
    this.isRecalled = false,
    this.isClosed = false,
    this.createdAt,
    this.updatedAt,
    this.notes = const [],
    this.routingHistory = const [],
    this.attachments = const [],
    this.createdBy,
    this.assignedTo,
    this.currentDivision,
    this.fileUrl,
    this.s3Key,
    this.holdReason,
    this.deskArrivalTime,
    this.allottedTime,
  });

  factory FileModel.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>> listFrom(dynamic v) {
      if (v == null) return [];
      if (v is List) return v.map((e) => e is Map ? Map<String, dynamic>.from(e as Map) : <String, dynamic>{}).toList();
      return [];
    }
    return FileModel(
      id: json['id'] as String,
      fileNumber: json['fileNumber'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      priority: json['priority'] as String? ?? 'NORMAL',
      priorityCategory: json['priorityCategory'] as String?,
      departmentId: json['departmentId'] as String?,
      department: json['department'] as Map<String, dynamic>?,
      createdById: json['createdById'] as String?,
      assignedToId: json['assignedToId'] as String?,
      isRedListed: json['isRedListed'] as bool? ?? false,
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'].toString()) : null,
      deskDueDate: json['deskDueDate'] != null ? DateTime.tryParse(json['deskDueDate'].toString()) : null,
      timeRemaining: json['timeRemaining'] as int?,
      timerPercentage: json['timerPercentage'] as int?,
      isOnHold: json['isOnHold'] as bool? ?? false,
      isRecalled: json['isRecalled'] as bool? ?? false,
      isClosed: json['isClosed'] as bool? ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
      notes: listFrom(json['notes']),
      routingHistory: listFrom(json['routingHistory']),
      attachments: listFrom(json['attachments']),
      createdBy: json['createdBy'] as Map<String, dynamic>?,
      assignedTo: json['assignedTo'] as Map<String, dynamic>?,
      currentDivision: json['currentDivision'] as Map<String, dynamic>?,
      fileUrl: json['fileUrl'] as String?,
      s3Key: json['s3Key'] as String?,
      holdReason: json['holdReason'] as String?,
      deskArrivalTime: json['deskArrivalTime'] != null ? DateTime.tryParse(json['deskArrivalTime'].toString()) : null,
      allottedTime: json['allottedTime'] as int?,
    );
  }

  String get departmentName => department != null && department!['name'] != null
      ? department!['name'] as String
      : '';
}

/// One note on a file (from file.notes).
class FileNoteModel {
  final String id;
  final String content;
  final DateTime? createdAt;
  final Map<String, dynamic>? user;

  FileNoteModel({required this.id, required this.content, this.createdAt, this.user});
  String get userName => user?['name']?.toString() ?? '—';
  static FileNoteModel fromJson(Map<String, dynamic> json) => FileNoteModel(
    id: json['id']?.toString() ?? '',
    content: json['content']?.toString() ?? '',
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    user: json['user'] as Map<String, dynamic>?,
  );
}

/// One routing history entry (from file.routingHistory).
class RoutingEntryModel {
  final String id;
  final String action;
  final String? remarks;
  final DateTime? createdAt;
  final Map<String, dynamic>? fromUser;
  final Map<String, dynamic>? toUser;

  RoutingEntryModel({required this.id, required this.action, this.remarks, this.createdAt, this.fromUser, this.toUser});
  static RoutingEntryModel fromJson(Map<String, dynamic> json) => RoutingEntryModel(
    id: json['id']?.toString() ?? '',
    action: json['action']?.toString() ?? json['actionString']?.toString() ?? '—',
    remarks: json['remarks']?.toString(),
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    fromUser: json['fromUser'] as Map<String, dynamic>?,
    toUser: json['toUser'] as Map<String, dynamic>?,
  );
}

/// One attachment (from file.attachments).
class FileAttachmentModel {
  final String id;
  final String filename;
  final String mimeType;
  final int size;
  final String url;

  FileAttachmentModel({required this.id, required this.filename, required this.mimeType, required this.size, required this.url});
  static FileAttachmentModel fromJson(Map<String, dynamic> json) => FileAttachmentModel(
    id: json['id']?.toString() ?? '',
    filename: json['filename']?.toString() ?? 'file',
    mimeType: json['mimeType']?.toString() ?? 'application/octet-stream',
    size: (json['size'] is num) ? (json['size'] as num).toInt() : 0,
    url: json['url']?.toString() ?? '',
  );
}
