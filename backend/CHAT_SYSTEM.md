# Chat System (DMs + Groups)

Internal chat for official communication: direct messages (DMs) and admin-managed groups.

## Features

- **Direct messages (DMs)** – Any user can start a DM with another user.
- **Groups** – Created and managed by **admins** or users with the **Chat Manager** role.
- **Chat Manager role** – `CHAT_MANAGER` can create groups and add/remove members (delegated from department admin).
- **Real-time** – New messages are pushed via WebSocket (Socket.IO namespace `/chat`).

## Roles

| Role            | Create DM | Create group | Add/remove members |
|-----------------|-----------|--------------|--------------------|
| Any user        | ✓         | ✗            | ✗ (only leave self) |
| DEPT_ADMIN      | ✓         | ✓            | ✓                  |
| SUPER_ADMIN     | ✓         | ✓            | ✓                  |
| CHAT_MANAGER    | ✓         | ✓            | ✓                  |

## API

- `GET /chat/conversations` – List my conversations.
- `GET /chat/conversations/:id` – Get one conversation (must be member).
- `POST /chat/dm/:otherUserId` – Get or create DM with a user.
- `POST /chat/groups` – Create group (body: `name`, optional `description`, `departmentId`, `memberIds`). **Guarded:** SUPER_ADMIN, DEPT_ADMIN, CHAT_MANAGER.
- `POST /chat/conversations/:id/members` – Add members (body: `userIds`). **Guarded:** SUPER_ADMIN, DEPT_ADMIN, CHAT_MANAGER.
- `POST /chat/conversations/:id/members/:userId/remove` – Remove member (or leave).
- `GET /chat/conversations/:id/messages?cursor=&limit=50` – Paginated messages.
- `POST /chat/conversations/:id/messages` – Send message (body: `content`).
- `POST /chat/conversations/:id/read` – Mark as read (optional body: `messageId`).
- `GET /chat/users?departmentId=&search=` – List users for starting DM or adding to group.

## WebSocket (Socket.IO)

- **Namespace:** `/chat`
- **Auth:** `auth: { token: "<JWT>" }` on connect.
- **Events:**
  - **Client → Server:** `join_conversation` / `leave_conversation` with `{ conversationId }`.
  - **Server → Client:** `new_message` (message object), `members_updated` (conversation).

## Database

- `ChatConversation` – type (DM | GROUP), name, description, departmentId, createdById.
- `ChatConversationMember` – conversationId, userId, role (member | admin), lastReadAt.
- `ChatMessage` – conversationId, senderId, content.
- `ChatReadReceipt` – messageId, userId, readAt.

## Frontend

- **/chat** – List conversations, “New DM”, “New Group” (if admin/chat-manager). Click conversation → `/chat/[id]`.
- **/chat/[id]** – Thread: header, messages, composer. Real-time via Socket.IO. “Add members” for groups (admin/chat-manager).

## Setup

1. Add `CHAT_MANAGER` to `UserRole` and run Prisma migration/push (already in schema).
2. Assign the Chat Manager role to users who should manage groups (e.g. from Admin → Users).
3. Ensure backend and frontend use the same API base URL for REST and WebSocket (`NEXT_PUBLIC_API_URL`).
