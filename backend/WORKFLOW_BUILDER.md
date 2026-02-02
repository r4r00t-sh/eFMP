# Custom Workflow Builder - Documentation

The Custom Workflow Builder allows administrators to create, modify, and manage file processing workflows without writing code.

## Overview

The workflow builder enables:
- **Visual workflow design** - Create workflows with nodes and connections
- **Role-based routing** - Assign tasks to specific roles, users, or departments
- **Conditional branching** - Create decision points based on file attributes
- **Time limits** - Set deadlines for each step
- **Templates** - Use pre-built workflows or create your own
- **Version control** - Track workflow versions and changes

## Architecture

### Database Models

1. **Workflow** - Main workflow definition
   - Name, code, description
   - Department scope (global or department-specific)
   - File type and priority category filters
   - Status: draft, published, active

2. **WorkflowNode** - Individual steps in the workflow
   - Node types: `start`, `task`, `decision`, `end`, `parallel`, `merge`
   - Assignee configuration (role, user, department, dynamic)
   - Time limits and available actions
   - Visual positioning (X, Y coordinates)

3. **WorkflowEdge** - Connections between nodes
   - Source and target nodes
   - Conditions for conditional routing
   - Priority for multiple edges
   - Visual styling

4. **WorkflowExecution** - Runtime workflow instances
   - Tracks current node for each file
   - Stores workflow variables
   - Status: running, completed, failed, paused

5. **WorkflowExecutionStep** - Individual step executions
   - Records who performed the action
   - Captures results and output
   - Tracks timing and duration

## Node Types

### 1. Start Node
- Entry point of the workflow
- No assignee required
- Automatically triggered when file enters workflow

### 2. Task Node
- Represents a user task (e.g., review, approve)
- Requires assignee configuration
- Has time limits
- Defines available actions

**Assignee Types:**
- `role` - Assign to users with specific role (e.g., APPROVAL_AUTHORITY)
- `user` - Assign to specific user ID
- `department` - Assign to department admin
- `division` - Assign to division users
- `dynamic` - Use file's current assignee or creator

**Available Actions:**
- `approve`, `reject`, `forward`, `return`
- `request_opinion`, `provide_opinion`
- `dispatch`, `hold`, `release`
- Custom actions can be added

### 3. Decision Node
- Conditional branching point
- No assignee (automatic evaluation)
- Uses conditions to determine next node

**Condition Format:**
```json
{
  "field": "action",
  "operator": "equals",
  "value": "approve"
}
```

**Operators:**
- `equals`, `not_equals`
- `greater_than`, `less_than`
- `contains`, `in`

### 4. End Node
- Workflow completion point
- Marks file as processed
- Can have multiple end nodes (e.g., approved, rejected)

### 5. Parallel Node (Future)
- Split workflow into parallel branches
- Wait for all branches to complete

### 6. Merge Node (Future)
- Merge parallel branches back together

## API Endpoints

### Workflow Management
- `POST /workflows` - Create workflow
- `GET /workflows` - List workflows
- `GET /workflows/:id` - Get workflow details
- `PATCH /workflows/:id` - Update workflow
- `DELETE /workflows/:id` - Delete workflow
- `POST /workflows/:id/publish` - Publish workflow
- `POST /workflows/:id/clone` - Clone workflow
- `GET /workflows/:id/validate` - Validate workflow

### Node Management
- `POST /workflows/:id/nodes` - Add node
- `PATCH /workflows/nodes/:nodeId` - Update node
- `DELETE /workflows/nodes/:nodeId` - Delete node

### Edge Management
- `POST /workflows/:id/edges` - Add edge
- `PATCH /workflows/edges/:edgeId` - Update edge
- `DELETE /workflows/edges/:edgeId` - Delete edge

### Workflow Execution
- `POST /workflows/:id/start` - Start workflow for a file
- `POST /workflows/executions/:id/execute` - Execute workflow step
- `GET /workflows/executions/file/:fileId` - Get execution for file
- `GET /workflows/executions/:id/actions` - Get available actions
- `POST /workflows/executions/:id/pause` - Pause workflow
- `POST /workflows/executions/:id/resume` - Resume workflow

### Templates
- `GET /workflows/templates/list` - List templates
- `POST /workflows/templates/:id/use` - Create from template
- `POST /workflows/:id/export-template` - Export as template

## Pre-built Templates

### 1. Simple Approval Workflow
**Flow:** Inward → Section Officer → Approval Authority → Dispatch

**Use Case:** Basic file approval process

### 2. Consultation Workflow
**Flow:** Section Officer → Opinion Decision → Opinion Desk (if needed) → Approval → End

**Use Case:** Files requiring external opinions

### 3. Multi-Level Approval
**Flow:** Inward → Section Officer → Dept Admin → Approval Authority → Dispatch

**Use Case:** Files requiring multiple approval levels

## Usage Examples

### Creating a Workflow

```typescript
// 1. Create workflow
const workflow = await api.post('/workflows', {
  name: 'Custom Approval Process',
  code: 'CUSTOM_APPROVAL',
  description: 'Custom workflow for special files',
  fileType: 'application',
  priorityCategory: 'URGENT',
});

// 2. Add start node
await api.post(`/workflows/${workflow.id}/nodes`, {
  nodeId: 'start',
  nodeType: 'start',
  label: 'Start',
  positionX: 100,
  positionY: 200,
});

// 3. Add task node
await api.post(`/workflows/${workflow.id}/nodes`, {
  nodeId: 'review',
  nodeType: 'task',
  label: 'Review',
  assigneeType: 'role',
  assigneeValue: 'SECTION_OFFICER',
  timeLimit: 259200, // 3 days in seconds
  availableActions: ['approve', 'reject', 'return'],
  positionX: 300,
  positionY: 200,
});

// 4. Add end node
await api.post(`/workflows/${workflow.id}/nodes`, {
  nodeId: 'end',
  nodeType: 'end',
  label: 'End',
  positionX: 500,
  positionY: 200,
});

// 5. Connect nodes
await api.post(`/workflows/${workflow.id}/edges`, {
  sourceNodeId: 'start-node-id',
  targetNodeId: 'review-node-id',
  label: 'Begin',
});

await api.post(`/workflows/${workflow.id}/edges`, {
  sourceNodeId: 'review-node-id',
  targetNodeId: 'end-node-id',
  label: 'Complete',
});

// 6. Publish workflow
await api.post(`/workflows/${workflow.id}/publish`);
```

### Using a Workflow

```typescript
// 1. Start workflow for a file
const execution = await api.post(`/workflows/${workflowId}/start`, {
  fileId: 'file-uuid',
  variables: {
    priority: 'high',
    department: 'finance',
  },
});

// 2. Get available actions for current step
const actions = await api.get(`/workflows/executions/${execution.id}/actions`);
// Returns: ['approve', 'reject', 'return']

// 3. Execute a step
await api.post(`/workflows/executions/${execution.id}/execute`, {
  action: 'approve',
  remarks: 'Approved after review',
  output: {
    approvalLevel: 1,
    approvedBy: 'John Doe',
  },
});

// 4. Check execution status
const status = await api.get(`/workflows/executions/file/${fileId}`);
```

## Frontend Pages

### 1. Workflow List (`/admin/workflows`)
- View all workflows
- Create new workflows
- Use templates
- Clone, publish, delete workflows

### 2. Workflow Builder (`/admin/workflows/:id/builder`)
- Add/edit/delete nodes
- Add/edit/delete connections
- Configure node properties
- Validate workflow
- Publish workflow

## Workflow Execution Flow

1. **File Created** → Workflow assigned based on file type/priority
2. **Workflow Started** → Execution record created
3. **Current Node** → User sees available actions
4. **Action Performed** → Engine evaluates conditions and moves to next node
5. **Next Node** → Notifies next assignee
6. **Repeat** → Until end node reached
7. **Workflow Completed** → File marked as processed

## Best Practices

1. **Always have start and end nodes** - Required for valid workflows
2. **Test before publishing** - Use validation endpoint
3. **Use meaningful node IDs** - Makes debugging easier
4. **Set appropriate time limits** - Based on actual processing times
5. **Document complex conditions** - Add descriptions to decision nodes
6. **Version control** - Clone before making major changes
7. **Department-specific workflows** - Create separate workflows per department if needed
8. **Use templates** - Start with templates and customize

## Troubleshooting

### Workflow won't publish
- Check validation errors
- Ensure start and end nodes exist
- Verify all nodes are connected

### Execution stuck
- Check current node's available actions
- Verify assignee exists and is active
- Check time limits haven't expired

### Node unreachable
- Verify incoming connections exist
- Check decision node conditions
- Validate edge priorities

## Future Enhancements

1. **Visual Drag-Drop Builder** - React Flow integration
2. **Parallel Processing** - Split and merge branches
3. **Webhooks** - Trigger external systems
4. **Email Notifications** - Automated emails at each step
5. **Approval Chains** - Multi-level approvals
6. **Escalation Rules** - Auto-escalate overdue tasks
7. **Business Rules Engine** - Complex conditional logic
8. **Workflow Analytics** - Performance metrics per workflow
9. **A/B Testing** - Test workflow variations
10. **Workflow Marketplace** - Share workflows across organizations

## Security

- Only SUPER_ADMIN and DEPT_ADMIN can create/modify workflows
- Department admins can only create workflows for their department
- Workflow validation prevents infinite loops
- Execution permissions checked at each step
- Audit trail for all workflow changes

## Performance Considerations

- Workflows are cached in Redis for fast execution
- Node evaluation is optimized for O(1) lookups
- Execution history is paginated
- Inactive workflows are not loaded into memory

## Migration from Hardcoded Workflows

To migrate existing hardcoded workflows:

1. Create workflow via API
2. Add nodes matching current process steps
3. Connect nodes with appropriate edges
4. Test with sample files
5. Publish when validated
6. Update file creation to use new workflow
7. Monitor executions for issues
8. Deprecate old hardcoded logic

## Support

For issues or questions:
- Check validation errors first
- Review execution logs
- Test with simple workflows
- Contact system administrator
