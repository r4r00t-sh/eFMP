"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Starting seed...');
    const org = await prisma.organisation.upsert({
        where: { id: 'org-gov-001' },
        update: {},
        create: {
            id: 'org-gov-001',
            name: 'Government of State',
        },
    });
    console.log('✅ Organisation created:', org.name);
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
    const finDept = departments.find(d => d.code === 'FIN');
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
    const itDept = departments.find(d => d.code === 'IT');
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
    const passwordHash = await bcrypt.hash('password123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: await bcrypt.hash('admin123', 10),
            name: 'Super Administrator',
            email: 'admin@efiling.gov',
            role: client_1.UserRole.SUPER_ADMIN,
        },
    });
    console.log('✅ Super Admin created:', superAdmin.username);
    const deptAdmin = await prisma.user.upsert({
        where: { username: 'finadmin' },
        update: {},
        create: {
            username: 'finadmin',
            passwordHash,
            name: 'Finance Admin',
            email: 'finadmin@efiling.gov',
            role: client_1.UserRole.DEPT_ADMIN,
            departmentId: finDept.id,
        },
    });
    const sectionOfficers = await Promise.all([
        prisma.user.upsert({
            where: { username: 'john.budget' },
            update: {},
            create: {
                username: 'john.budget',
                passwordHash,
                name: 'John Smith',
                email: 'john@efiling.gov',
                role: client_1.UserRole.SECTION_OFFICER,
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
                role: client_1.UserRole.SECTION_OFFICER,
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
                role: client_1.UserRole.SECTION_OFFICER,
                departmentId: finDept.id,
                divisionId: 'fin-audit',
            },
        }),
    ]);
    console.log('✅ Section Officers created:', sectionOfficers.length);
    const inwardDesk = await prisma.user.upsert({
        where: { username: 'inward.fin' },
        update: {},
        create: {
            username: 'inward.fin',
            passwordHash,
            name: 'Finance Inward Desk',
            email: 'inward@efiling.gov',
            role: client_1.UserRole.INWARD_DESK,
            departmentId: finDept.id,
        },
    });
    console.log('✅ Inward Desk created:', inwardDesk.username);
    const dispatcher = await prisma.user.upsert({
        where: { username: 'dispatch.fin' },
        update: {},
        create: {
            username: 'dispatch.fin',
            passwordHash,
            name: 'Finance Dispatcher',
            email: 'dispatch@efiling.gov',
            role: client_1.UserRole.DISPATCHER,
            departmentId: finDept.id,
        },
    });
    console.log('✅ Dispatcher created:', dispatcher.username);
    const approvalAuth = await prisma.user.upsert({
        where: { username: 'approver.fin' },
        update: {},
        create: {
            username: 'approver.fin',
            passwordHash,
            name: 'Finance Approver',
            email: 'approver@efiling.gov',
            role: client_1.UserRole.APPROVAL_AUTHORITY,
            departmentId: finDept.id,
        },
    });
    console.log('✅ Approval Authority created:', approvalAuth.username);
    const allUsers = [superAdmin, deptAdmin, ...sectionOfficers, inwardDesk, dispatcher, approvalAuth];
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
    const getTimeAllotment = (category) => {
        const allotments = {
            [client_1.FilePriorityCategory.ROUTINE]: 3 * 24 * 60 * 60,
            [client_1.FilePriorityCategory.URGENT]: 24 * 60 * 60,
            [client_1.FilePriorityCategory.IMMEDIATE]: 4 * 60 * 60,
            [client_1.FilePriorityCategory.PROJECT]: 7 * 24 * 60 * 60,
        };
        return allotments[category];
    };
    const now = new Date();
    const files = await Promise.all([
        prisma.file.create({
            data: {
                fileNumber: `FIN-BUD-${new Date().getFullYear()}-0001`,
                subject: 'Budget Proposal for Q2 2026',
                description: 'Annual budget proposal for review and approval',
                status: client_1.FileStatus.PENDING,
                priority: client_1.FilePriority.HIGH,
                priorityCategory: client_1.FilePriorityCategory.URGENT,
                departmentId: finDept.id,
                createdById: inwardDesk.id,
                assignedToId: sectionOfficers[0].id,
                currentDivisionId: 'fin-budget',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                deskArrivalTime: new Date(Date.now() - 18 * 60 * 60 * 1000),
                allottedTime: getTimeAllotment(client_1.FilePriorityCategory.URGENT),
                timerPercentage: 25,
            },
        }),
        prisma.file.create({
            data: {
                fileNumber: `FIN-ACC-${new Date().getFullYear()}-0002`,
                subject: 'Travel Reimbursement Request - March 2026',
                description: 'Staff travel expenses for approval',
                status: client_1.FileStatus.IN_PROGRESS,
                priority: client_1.FilePriority.NORMAL,
                priorityCategory: client_1.FilePriorityCategory.ROUTINE,
                departmentId: finDept.id,
                createdById: inwardDesk.id,
                assignedToId: sectionOfficers[1].id,
                currentDivisionId: 'fin-accounts',
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                deskArrivalTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                allottedTime: getTimeAllotment(client_1.FilePriorityCategory.ROUTINE),
                timerPercentage: 66,
            },
        }),
        prisma.file.create({
            data: {
                fileNumber: `FIN-AUD-${new Date().getFullYear()}-0003`,
                subject: 'Court Order - Urgent Response Required',
                description: 'Immediate response required for court proceedings',
                status: client_1.FileStatus.PENDING,
                priority: client_1.FilePriority.URGENT,
                priorityCategory: client_1.FilePriorityCategory.IMMEDIATE,
                departmentId: finDept.id,
                createdById: deptAdmin.id,
                assignedToId: sectionOfficers[2].id,
                currentDivisionId: 'fin-audit',
                isRedListed: true,
                redListedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
                deskArrivalTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
                allottedTime: getTimeAllotment(client_1.FilePriorityCategory.IMMEDIATE),
                timerPercentage: 0,
            },
        }),
        prisma.file.create({
            data: {
                fileNumber: `FIN-GEN-${new Date().getFullYear()}-0004`,
                subject: 'Vendor Payment Processing',
                description: 'Monthly vendor payments for approval',
                status: client_1.FileStatus.ON_HOLD,
                priority: client_1.FilePriority.NORMAL,
                priorityCategory: client_1.FilePriorityCategory.ROUTINE,
                departmentId: finDept.id,
                createdById: inwardDesk.id,
                isOnHold: true,
                holdReason: 'Awaiting vendor bank details confirmation',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                deskArrivalTime: now,
                allottedTime: getTimeAllotment(client_1.FilePriorityCategory.ROUTINE),
                timerPercentage: 100,
            },
        }),
        prisma.file.create({
            data: {
                fileNumber: `FIN-BUD-${new Date().getFullYear()}-0005`,
                subject: 'Annual Report FY 2025-26',
                description: 'Long-term annual report compilation',
                status: client_1.FileStatus.IN_PROGRESS,
                priority: client_1.FilePriority.LOW,
                priorityCategory: client_1.FilePriorityCategory.PROJECT,
                departmentId: finDept.id,
                createdById: inwardDesk.id,
                assignedToId: sectionOfficers[0].id,
                currentDivisionId: 'fin-budget',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                deskArrivalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                allottedTime: getTimeAllotment(client_1.FilePriorityCategory.PROJECT),
                timerPercentage: 71,
            },
        }),
    ]);
    console.log('✅ Sample files created:', files.length);
    await prisma.fileRouting.createMany({
        data: [
            {
                fileId: files[0].id,
                fromUserId: inwardDesk.id,
                toUserId: sectionOfficers[0].id,
                toDivisionId: 'fin-budget',
                action: client_1.FileAction.FORWARDED,
                actionString: 'forward',
                remarks: 'Please review and process',
            },
            {
                fileId: files[1].id,
                fromUserId: inwardDesk.id,
                toUserId: sectionOfficers[1].id,
                toDivisionId: 'fin-accounts',
                action: client_1.FileAction.FORWARDED,
                actionString: 'forward',
                remarks: 'For accounts verification',
            },
        ],
    });
    console.log('✅ Routing history created');
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
    console.log('\n📋 Test Accounts:');
    console.log('  Super Admin:        admin / admin123');
    console.log('  Dept Admin:         finadmin / password123');
    console.log('  Approval Authority: approver.fin / password123');
    console.log('  Section Officers:   john.budget, jane.accounts, mike.audit / password123');
    console.log('  Inward Desk:        inward.fin / password123');
    console.log('  Dispatcher:         dispatch.fin / password123');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map