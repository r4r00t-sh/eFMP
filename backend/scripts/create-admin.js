const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://efiling:efiling123@postgres:5432/efiling_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  try {
    // Create Organisation
    const org = await prisma.organisation.create({
      data: {
        name: 'Default Organisation',
      },
    });
    console.log('Created Organisation:', org.name);

    // Create Department
    const dept = await prisma.department.create({
      data: {
        name: 'Admin Department',
        code: 'ADMIN',
        organisationId: org.id,
        isInwardDesk: true,
      },
    });
    console.log('Created Department:', dept.name);

    // Create Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        name: 'Super Admin',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        departmentId: dept.id,
      },
    });
    console.log('Created Admin User:', user.username);
    console.log('\n✅ Default credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createAdmin();

