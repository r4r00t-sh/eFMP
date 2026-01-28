import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllUsers(filters?: {
        departmentId?: string;
        role?: string;
        search?: string;
    }): Promise<any>;
    getUserById(id: string): Promise<any>;
    createUser(data: {
        username: string;
        password: string;
        name: string;
        email?: string;
        role: string;
        departmentId?: string;
        divisionId?: string;
    }): Promise<any>;
    updateUser(id: string, data: {
        name?: string;
        email?: string;
        role?: string;
        departmentId?: string;
        divisionId?: string;
        isActive?: boolean;
    }): Promise<any>;
    changePassword(id: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    resetPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    deactivateUser(id: string): Promise<any>;
}
