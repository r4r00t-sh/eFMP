# Chat System - Audit & Compliance Documentation

## Overview
The chat system in the Gateway E-Filing System is designed for **permanent message retention** to meet government compliance and audit requirements.

## Message Retention Policy

### ✅ Permanent Storage
- **All chat messages are stored permanently** in the database
- **No delete functionality** exists for messages
- Messages are retained indefinitely for audit trails
- Complete conversation history is always available

### Database Schema
```
ChatMessage
├── id (UUID)
├── conversationId (FK to ChatConversation)
├── senderId (FK to User)
├── content (Text)
├── createdAt (Timestamp)
├── updatedAt (Timestamp)
└── readReceipts (Related ChatReadReceipt[])
```

## Audit Features

### 1. Message Export (Admin Only)
**Endpoint**: `GET /chat/conversations/:id/export`

**Access**: SUPER_ADMIN, DEPT_ADMIN, CHAT_MANAGER

**Parameters**:
- `startDate` (optional): Filter messages from this date
- `endDate` (optional): Filter messages until this date

**Response**:
```json
{
  "conversation": {
    "id": "uuid",
    "type": "DM | GROUP",
    "name": "string",
    "department": {...},
    "createdBy": {...},
    "members": [...]
  },
  "messages": [
    {
      "id": "uuid",
      "content": "message text",
      "sender": {...},
      "createdAt": "timestamp",
      "readBy": [...]
    }
  ],
  "exportedAt": "timestamp",
  "exportedBy": {...},
  "totalMessages": 123
}
```

### 2. Chat Statistics (Admin Dashboard)
**Endpoint**: `GET /chat/statistics`

**Access**: SUPER_ADMIN, DEPT_ADMIN, CHAT_MANAGER

**Response**:
```json
{
  "totalConversations": 50,
  "totalMessages": 1234,
  "activeConversations": 25,
  "messageRetention": "permanent",
  "complianceStatus": "compliant"
}
```

### 3. Read Receipts
- Every message tracks who read it and when
- Read receipts are stored in `ChatReadReceipt` table
- Provides accountability for message delivery

### 4. Conversation Metadata
- All conversations track:
  - Creator
  - Creation date
  - Last message timestamp
  - Department association (if applicable)
  - Member join dates

## Access Control

### Message Access
- Users can only view messages in conversations they are members of
- Admins can export any conversation for audit purposes
- All API access is authenticated via JWT

### Group Management
- Only SUPER_ADMIN, DEPT_ADMIN, and CHAT_MANAGER can:
  - Create groups
  - Add members to groups
  - Export conversation data
  - View chat statistics

## Compliance Features

### ✅ Implemented
1. **Permanent Message Storage**: All messages stored indefinitely
2. **Audit Trail**: Complete history with timestamps and sender info
3. **Read Receipts**: Track message delivery and reading
4. **Export Capability**: Admins can export conversations for review
5. **Access Logging**: All API calls are authenticated and can be logged
6. **Department Scoping**: Conversations can be associated with departments
7. **Role-Based Access**: Strict permissions for sensitive operations

### 🔒 Security
- JWT authentication required for all endpoints
- Role-based authorization for admin functions
- Users can only access conversations they're members of
- No public access to chat data

## Usage Examples

### Export a Conversation (Admin)
```bash
# Export all messages from a conversation
GET /chat/conversations/{conversationId}/export
Authorization: Bearer {admin_jwt_token}

# Export messages from specific date range
GET /chat/conversations/{conversationId}/export?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer {admin_jwt_token}
```

### View Chat Statistics (Admin)
```bash
# System-wide statistics (SUPER_ADMIN)
GET /chat/statistics
Authorization: Bearer {super_admin_jwt_token}

# Department-specific statistics (DEPT_ADMIN)
GET /chat/statistics?departmentId={dept_id}
Authorization: Bearer {dept_admin_jwt_token}
```

## Data Retention Recommendations

### For Government Compliance
1. **Regular Backups**: Database should be backed up regularly
2. **Archive Strategy**: Consider archiving old conversations to separate storage after X years
3. **Export Reports**: Periodic exports for compliance audits
4. **Access Logs**: Enable database query logging for sensitive operations

### Best Practices
- Export important conversations periodically for offline storage
- Review chat statistics monthly for usage patterns
- Maintain backup of exported data in secure location
- Document any compliance-related exports with metadata

## Technical Notes

### Database Indexes
Optimized indexes for:
- Conversation lookup by ID
- Messages by conversation and date
- User membership queries
- Read receipt lookups

### Performance
- Pagination for message lists (default 50 messages)
- Cursor-based pagination for efficient large dataset handling
- Indexed queries for fast retrieval

### Future Enhancements
- [ ] Automated periodic exports to archive storage
- [ ] Advanced search across all messages (admin only)
- [ ] Compliance report generation (PDF format)
- [ ] Message flagging/tagging for important communications
- [ ] Integration with file system for document-related chats

## Contact
For questions about chat compliance features, contact the system administrator or development team.

---
**Last Updated**: January 2026
**Version**: 1.0
