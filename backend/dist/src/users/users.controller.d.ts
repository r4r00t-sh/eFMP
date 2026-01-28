import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAllUsers(req: any, departmentId?: string, role?: string, search?: string): Promise<any>;
    getUser(id: string, req: any): Promise<any>;
    createUser(req: any, body: {
        username: string;
        password: string;
        name: string;
        email?: string;
        role: string;
        departmentId?: string;
        divisionId?: string;
    }): Promise<any>;
    updateUser(id: string, req: any, body: {
        name?: string;
        email?: string;
        role?: string;
        departmentId?: string;
        divisionId?: string;
        isActive?: boolean;
    }): Promise<any>;
    updatePassword(id: string, req: any, body: {
        currentPassword?: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    deleteUser(id: string, req: any): Promise<any>;
}
