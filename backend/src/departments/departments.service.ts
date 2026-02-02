import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async getAllDepartments() {
    return this.prisma.department.findMany({
      include: {
        organisation: { select: { id: true, name: true } },
        divisions: { select: { id: true, name: true } },
        _count: { select: { users: true, files: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDepartmentById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        organisation: true,
        divisions: {
          include: {
            _count: { select: { users: true } },
          },
        },
        users: {
          select: { id: true, name: true, username: true, roles: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async createDepartment(data: {
    name: string;
    code: string;
    organisationId: string;
  }) {
    return this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        organisationId: data.organisationId,
      },
    });
  }

  async updateDepartment(id: string, data: { name?: string; code?: string }) {
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async deleteDepartment(id: string) {
    return this.prisma.department.delete({
      where: { id },
    });
  }

  async getInwardDeskDepartments(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true },
    });

    if (!user?.departmentId) {
      return [];
    }

    return this.prisma.department.findMany({
      where: { id: user.departmentId },
      include: {
        divisions: true,
      },
    });
  }

  async getDivisions(departmentId: string) {
    return this.prisma.division.findMany({
      where: { departmentId },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDivision(departmentId: string, name: string) {
    // Generate code from name
    const code = name.toUpperCase().replace(/\s+/g, '-').substring(0, 10);

    return this.prisma.division.create({
      data: {
        name,
        code,
        departmentId,
      },
    });
  }

  async getDivisionUsers(divisionId: string) {
    return this.prisma.user.findMany({
      where: {
        divisionId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        roles: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
