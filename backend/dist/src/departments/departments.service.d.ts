import { PrismaService } from '../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllDepartments(): Promise<any>;
    getDepartmentById(id: string): Promise<any>;
    createDepartment(data: {
        name: string;
        code: string;
        organisationId: string;
    }): Promise<any>;
    updateDepartment(id: string, data: {
        name?: string;
        code?: string;
    }): Promise<any>;
    deleteDepartment(id: string): Promise<any>;
    getInwardDeskDepartments(userId: string): Promise<any>;
    getDivisions(departmentId: string): Promise<any>;
    createDivision(departmentId: string, name: string): Promise<any>;
    getDivisionUsers(divisionId: string): Promise<any>;
}
