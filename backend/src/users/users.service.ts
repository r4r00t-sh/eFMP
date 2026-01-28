import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(filters?: {
    departmentId?: string;
    role?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: { select: { id: true, name: true, code: true } },
        division: { select: { id: true, name: true } },
        points: { select: { currentPoints: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true, code: true } },
        division: { select: { id: true, name: true } },
        points: true,
        _count: {
          select: {
            filesCreated: true,
            filesAssigned: true,
            notes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    role: string;
    departmentId?: string;
    divisionId?: string;
  }) {
    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        name: data.name,
        email: data.email,
        role: data.role as any,
        departmentId: data.departmentId,
        divisionId: data.divisionId,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        department: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    });

    // Create initial points record
    await this.prisma.userPoints.create({
      data: {
        userId: user.id,
        basePoints: 1000,
        currentPoints: 1000,
      },
    });

    return user;
  }

  async updateUser(id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    departmentId?: string;
    divisionId?: string;
    isActive?: boolean;
  }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role && { role: data.role as any }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.divisionId !== undefined && { divisionId: data.divisionId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        department: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async resetPassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  async deactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

