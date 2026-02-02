import { PrismaClient, UserRole, FileStatus, FilePriority, FileAction, FilePriorityCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create Organisation
  const org = await prisma.organisation.upsert({
    where: { id: 'org-gov-001' },
    update: {},
    create: {
      id: 'org-gov-001',
      name: 'Government of State',
    },
  });
  console.log('✅ Organisation created:', org.name);

  // Create Departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'FIN' },
      update: {},
      create: {
        name: 'Finance Department',
        code: 'FIN',
        organisationId: org.id,
      },
    }),
    prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: {
        name: 'Human Resources',
        code: 'HR',
        organisationId: org.id,
      },
    }),
    prisma.department.upsert({
      where: { code: 'IT' },
      update: {},
      create: {
        name: 'Information Technology',
        code: 'IT',
        organisationId: org.id,
      },
    }),
    prisma.department.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        name: 'Administration',
        code: 'ADMIN',
        organisationId: org.id,
      },
    }),
  ]);
  console.log('✅ Departments created:', departments.length);

  // Create Divisions for Finance Department
  const finDept = departments.find(d => d.code === 'FIN')!;
  const divisions = await Promise.all([
    prisma.division.upsert({
      where: { id: 'fin-budget' },
      update: {},
      create: {
        id: 'fin-budget',
        name: 'Budget Section',
        code: 'FIN-BUD',
        departmentId: finDept.id,
      },
    }),
    prisma.division.upsert({
      where: { id: 'fin-accounts' },
      update: {},
      create: {
        id: 'fin-accounts',
        name: 'Accounts Section',
        code: 'FIN-ACC',
        departmentId: finDept.id,
      },
    }),
    prisma.division.upsert({
      where: { id: 'fin-audit' },
      update: {},
      create: {
        id: 'fin-audit',
        name: 'Audit Section',
        code: 'FIN-AUD',
        departmentId: finDept.id,
      },
    }),
  ]);
  console.log('✅ Divisions created:', divisions.length);

  // Create Divisions for IT Department
  const itDept = departments.find(d => d.code === 'IT')!;
  await Promise.all([
    prisma.division.upsert({
      where: { id: 'it-infra' },
      update: {},
      create: {
        id: 'it-infra',
        name: 'Infrastructure',
        code: 'IT-INF',
        departmentId: itDept.id,
      },
    }),
    prisma.division.upsert({
      where: { id: 'it-dev' },
      update: {},
      create: {
        id: 'it-dev',
        name: 'Development',
        code: 'IT-DEV',
        departmentId: itDept.id,
      },
    }),
  ]);

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { roles: [UserRole.SUPER_ADMIN] },
    create: {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Super Administrator',
      email: 'admin@efiling.gov',
      roles: [UserRole.SUPER_ADMIN],
    },
  });
  console.log('✅ Super Admin created:', superAdmin.username);

  // Department Admins
  const deptAdmin = await prisma.user.upsert({
    where: { username: 'finadmin' },
    update: { roles: [UserRole.DEPT_ADMIN] },
    create: {
      username: 'finadmin',
      passwordHash,
      name: 'Finance Admin',
      email: 'finadmin@efiling.gov',
      roles: [UserRole.DEPT_ADMIN],
      departmentId: finDept.id,
    },
  });

  // Section Officers
  const sectionOfficers = await Promise.all([
    prisma.user.upsert({
      where: { username: 'john.budget' },
      update: {},
      create: {
        username: 'john.budget',
        passwordHash,
        name: 'John Smith',
        email: 'john@efiling.gov',
        roles: [UserRole.SECTION_OFFICER],
        departmentId: finDept.id,
        divisionId: 'fin-budget',
      },
    }),
    prisma.user.upsert({
      where: { username: 'jane.accounts' },
      update: {},
      create: {
        username: 'jane.accounts',
        passwordHash,
        name: 'Jane Doe',
        email: 'jane@efiling.gov',
        roles: [UserRole.SECTION_OFFICER],
        departmentId: finDept.id,
        divisionId: 'fin-accounts',
      },
    }),
    prisma.user.upsert({
      where: { username: 'mike.audit' },
      update: {},
      create: {
        username: 'mike.audit',
        passwordHash,
        name: 'Mike Johnson',
        email: 'mike@efiling.gov',
        roles: [UserRole.SECTION_OFFICER],
        departmentId: finDept.id,
        divisionId: 'fin-audit',
      },
    }),
  ]);
  console.log('✅ Section Officers created:', sectionOfficers.length);

  // Inward Desk
  const inwardDesk = await prisma.user.upsert({
    where: { username: 'inward.fin' },
    update: {},
    create: {
      username: 'inward.fin',
      passwordHash,
      name: 'Finance Inward Desk',
      email: 'inward@efiling.gov',
      roles: [UserRole.INWARD_DESK],
      departmentId: finDept.id,
    },
  });
  console.log('✅ Inward Desk created:', inwardDesk.username);

  // Dispatcher
  const dispatcher = await prisma.user.upsert({
    where: { username: 'dispatch.fin' },
    update: {},
    create: {
      username: 'dispatch.fin',
      passwordHash,
      name: 'Finance Dispatcher',
      email: 'dispatch@efiling.gov',
      roles: [UserRole.DISPATCHER],
      departmentId: finDept.id,
    },
  });
  console.log('✅ Dispatcher created:', dispatcher.username);

  // Approval Authority
  const approvalAuth = await prisma.user.upsert({
    where: { username: 'approver.fin' },
    update: {},
    create: {
      username: 'approver.fin',
      passwordHash,
      name: 'Finance Approver',
      email: 'approver@efiling.gov',
      roles: [UserRole.APPROVAL_AUTHORITY],
      departmentId: finDept.id,
    },
  });
  console.log('✅ Approval Authority created:', approvalAuth.username);

  // Chat Manager (can create groups and add members)
  const chatManager = await prisma.user.upsert({
    where: { username: 'chatmanager.fin' },
    update: {},
    create: {
      username: 'chatmanager.fin',
      passwordHash,
      name: 'Finance Chat Manager',
      email: 'chatmanager@efiling.gov',
      roles: [UserRole.CHAT_MANAGER],
      departmentId: finDept.id,
    },
  });
  console.log('✅ Chat Manager created:', chatManager.username);

  // Generic USER role (clerk)
  const clerk = await prisma.user.upsert({
    where: { username: 'clerk.fin' },
    update: {},
    create: {
      username: 'clerk.fin',
      passwordHash,
      name: 'Finance Clerk',
      email: 'clerk@efiling.gov',
      roles: [UserRole.USER],
      departmentId: finDept.id,
      divisionId: 'fin-budget',
    },
  });
  console.log('✅ Clerk (USER role) created:', clerk.username);

  // Create UserPoints for all users
  const allUsers = [superAdmin, deptAdmin, ...sectionOfficers, inwardDesk, dispatcher, approvalAuth, chatManager, clerk];
  for (const user of allUsers) {
    await prisma.userPoints.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        basePoints: 1000,
        currentPoints: 1000,
      },
    });
  }
  console.log('✅ User points initialized');

  // Create Default Workflow (active and published) - before files so it runs even if files fail
  const defaultWorkflow = await prisma.workflow.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default File Processing Workflow',
      code: 'DEFAULT',
      description: 'Standard workflow for file processing: Inward → Section Officer → Approval → Dispatch',
      departmentId: null, // Global workflow
      fileType: null,
      priorityCategory: null,
      createdById: superAdmin.id,
      publishedById: superAdmin.id,
      publishedAt: new Date(),
      isDraft: false,
      isActive: true,
      isPublished: true,
    },
  });
  console.log('✅ Default workflow created:', defaultWorkflow.name);

  // Create workflow nodes for default workflow
  const startNode = await prisma.workflowNode.create({
    data: {
      workflowId: defaultWorkflow.id,
      nodeId: 'start',
      nodeType: 'start',
      label: 'Start',
      description: 'File enters the system',
      positionX: 100,
      positionY: 100,
    },
  });

  const inwardNode = await prisma.workflowNode.create({
    data: {
      workflowId: defaultWorkflow.id,
      nodeId: 'inward_desk',
      nodeType: 'task',
      label: 'Inward Desk',
      description: 'File received at inward desk',
      assigneeType: 'role',
      assigneeValue: 'INWARD_DESK',
      timeLimit: 24 * 60 * 60, // 24 hours
      timeLimitType: 'business_days',
      availableActions: ['forward', 'return'],
      positionX: 100,
      positionY: 200,
    },
  });

  const sectionNode = await prisma.workflowNode.create({
    data: {
      workflowId: defaultWorkflow.id,
      nodeId: 'section_officer',
      nodeType: 'task',
      label: 'Section Officer',
      description: 'Processing by section officer',
      assigneeType: 'role',
      assigneeValue: 'SECTION_OFFICER',
      timeLimit: 3 * 24 * 60 * 60, // 3 days
      timeLimitType: 'business_days',
      availableActions: ['forward', 'return', 'request_opinion'],
      positionX: 100,
      positionY: 300,
    },
  });

  const approvalNode = await prisma.workflowNode.create({
    data: {
      workflowId: defaultWorkflow.id,
      nodeId: 'approval',
      nodeType: 'task',
      label: 'Approval Authority',
      description: 'Review and approval',
      assigneeType: 'role',
      assigneeValue: 'APPROVAL_AUTHORITY',
      timeLimit: 2 * 24 * 60 * 60, // 2 days
      timeLimitType: 'business_days',
      availableActions: ['approve', 'reject', 'return'],
      positionX: 100,
      positionY: 400,
    },
  });

  const dispatchNode = await prisma.workflowNode.create({
    data: {
      workflowId: defaultWorkflow.id,
      nodeId: 'dispatch',
      nodeType: 'task',
      label: 'Dispatch',
      description: 'File ready for dispatch',
      assigneeType: 'role',
      assigneeValue: 'DISPATCHER',
      timeLimit: 24 * 60 * 60, // 24 hours
      timeLimitType: 'business_days',
      availableActions: ['dispatch'],
      positionX: 100,
      positionY: 500,
    },
  });

  const endNode = await prisma.workflowNode.create({
    data: {
      workflowId: defaultWorkflow.id,
      nodeId: 'end',
      nodeType: 'end',
      label: 'End',
      description: 'File processing complete',
      positionX: 100,
      positionY: 600,
    },
  });

  // Create workflow edges (connections)
  await prisma.workflowEdge.createMany({
    data: [
      {
        workflowId: defaultWorkflow.id,
        sourceNodeId: startNode.id,
        targetNodeId: inwardNode.id,
        label: 'Start',
        priority: 1,
      },
      {
        workflowId: defaultWorkflow.id,
        sourceNodeId: inwardNode.id,
        targetNodeId: sectionNode.id,
        label: 'Forward',
        priority: 1,
      },
      {
        workflowId: defaultWorkflow.id,
        sourceNodeId: sectionNode.id,
        targetNodeId: approvalNode.id,
        label: 'Forward',
        priority: 1,
      },
      {
        workflowId: defaultWorkflow.id,
        sourceNodeId: approvalNode.id,
        targetNodeId: dispatchNode.id,
        label: 'Approved',
        priority: 1,
      },
      {
        workflowId: defaultWorkflow.id,
        sourceNodeId: dispatchNode.id,
        targetNodeId: endNode.id,
        label: 'Dispatched',
        priority: 1,
      },
    ],
  });
  console.log('✅ Default workflow nodes and edges created');

  // Helper function to calculate time allotment based on priority
  const getTimeAllotment = (category: FilePriorityCategory) => {
    const allotments: Record<FilePriorityCategory, number> = {
      [FilePriorityCategory.ROUTINE]: 3 * 24 * 60 * 60, // 3 days in seconds
      [FilePriorityCategory.URGENT]: 24 * 60 * 60,      // 24 hours
      [FilePriorityCategory.IMMEDIATE]: 4 * 60 * 60,    // 4 hours
      [FilePriorityCategory.PROJECT]: 7 * 24 * 60 * 60, // 7 days
    };
    return allotments[category];
  };

  // Create Sample Files with timing data
  const now = new Date();
  const files = await Promise.all([
    prisma.file.create({
      data: {
        fileNumber: `FIN-BUD-${new Date().getFullYear()}-0001`,
        subject: 'Budget Proposal for Q2 2026',
        description: 'Annual budget proposal for review and approval',
        status: FileStatus.PENDING,
        priority: FilePriority.HIGH,
        priorityCategory: FilePriorityCategory.URGENT,
        departmentId: finDept.id,
        createdById: inwardDesk.id,
        assignedToId: sectionOfficers[0].id,
        currentDivisionId: 'fin-budget',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        deskArrivalTime: new Date(Date.now() - 18 * 60 * 60 * 1000), // Arrived 18 hours ago
        allottedTime: getTimeAllotment(FilePriorityCategory.URGENT),
        timerPercentage: 25, // 25% time remaining
      },
    }),
    prisma.file.create({
      data: {
        fileNumber: `FIN-ACC-${new Date().getFullYear()}-0002`,
        subject: 'Travel Reimbursement Request - March 2026',
        description: 'Staff travel expenses for approval',
        status: FileStatus.IN_PROGRESS,
        priority: FilePriority.NORMAL,
        priorityCategory: FilePriorityCategory.ROUTINE,
        departmentId: finDept.id,
        createdById: inwardDesk.id,
        assignedToId: sectionOfficers[1].id,
        currentDivisionId: 'fin-accounts',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        deskArrivalTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Arrived 1 day ago
        allottedTime: getTimeAllotment(FilePriorityCategory.ROUTINE),
        timerPercentage: 66, // 66% time remaining
      },
    }),
    prisma.file.create({
      data: {
        fileNumber: `FIN-AUD-${new Date().getFullYear()}-0003`,
        subject: 'Court Order - Urgent Response Required',
        description: 'Immediate response required for court proceedings',
        status: FileStatus.PENDING,
        priority: FilePriority.URGENT,
        priorityCategory: FilePriorityCategory.IMMEDIATE,
        departmentId: finDept.id,
        createdById: deptAdmin.id,
        assignedToId: sectionOfficers[2].id,
        currentDivisionId: 'fin-audit',
        isRedListed: true,
        redListedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Red listed 2 hours ago
        dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // Overdue by 1 hour
        deskArrivalTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // Arrived 5 hours ago
        allottedTime: getTimeAllotment(FilePriorityCategory.IMMEDIATE),
        timerPercentage: 0, // Overdue
      },
    }),
    prisma.file.create({
      data: {
        fileNumber: `FIN-GEN-${new Date().getFullYear()}-0004`,
        subject: 'Vendor Payment Processing',
        description: 'Monthly vendor payments for approval',
        status: FileStatus.ON_HOLD,
        priority: FilePriority.NORMAL,
        priorityCategory: FilePriorityCategory.ROUTINE,
        departmentId: finDept.id,
        createdById: inwardDesk.id,
        isOnHold: true,
        holdReason: 'Awaiting vendor bank details confirmation',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        deskArrivalTime: now,
        allottedTime: getTimeAllotment(FilePriorityCategory.ROUTINE),
        timerPercentage: 100,
      },
    }),
    prisma.file.create({
      data: {
        fileNumber: `FIN-BUD-${new Date().getFullYear()}-0005`,
        subject: 'Annual Report FY 2025-26',
        description: 'Long-term annual report compilation',
        status: FileStatus.IN_PROGRESS,
        priority: FilePriority.LOW,
        priorityCategory: FilePriorityCategory.PROJECT,
        departmentId: finDept.id,
        createdById: inwardDesk.id,
        assignedToId: sectionOfficers[0].id,
        currentDivisionId: 'fin-budget',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deskArrivalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        allottedTime: getTimeAllotment(FilePriorityCategory.PROJECT),
        timerPercentage: 71, // 71% remaining
      },
    }),
  ]);
  console.log('✅ Sample files created:', files.length);

  // Create Routing History for files
  await prisma.fileRouting.createMany({
    data: [
      {
        fileId: files[0].id,
        fromUserId: inwardDesk.id,
        toUserId: sectionOfficers[0].id,
        toDivisionId: 'fin-budget',
        action: FileAction.FORWARDED,
        actionString: 'forward',
        remarks: 'Please review and process',
      },
      {
        fileId: files[1].id,
        fromUserId: inwardDesk.id,
        toUserId: sectionOfficers[1].id,
        toDivisionId: 'fin-accounts',
        action: FileAction.FORWARDED,
        actionString: 'forward',
        remarks: 'For accounts verification',
      },
    ],
  });
  console.log('✅ Routing history created');

  // Create Sample Notes
  await prisma.note.createMany({
    data: [
      {
        fileId: files[0].id,
        userId: sectionOfficers[0].id,
        content: 'Reviewed the budget proposal. Requesting additional details on IT expenditure.',
      },
      {
        fileId: files[0].id,
        userId: deptAdmin.id,
        content: 'Please expedite this as it needs to go to the ministry by end of week.',
      },
      {
        fileId: files[1].id,
        userId: sectionOfficers[1].id,
        content: 'All receipts verified. Ready for approval.',
      },
    ],
  });
  console.log('✅ Sample notes created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Test Accounts (all use password123 except Super Admin):');
  console.log('  Super Admin:        admin / admin123');
  console.log('  Dept Admin:         finadmin / password123');
  console.log('  Chat Manager:       chatmanager.fin / password123');
  console.log('  Approval Authority: approver.fin / password123');
  console.log('  Section Officers:   john.budget, jane.accounts, mike.audit / password123');
  console.log('  Inward Desk:        inward.fin / password123');
  console.log('  Dispatcher:         dispatch.fin / password123');
  console.log('  Clerk (USER):       clerk.fin / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
