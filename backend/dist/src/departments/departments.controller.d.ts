import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private departmentsService;
    constructor(departmentsService: DepartmentsService);
    getAllDepartments(): Promise<any>;
    getInwardDeskDepartments(req: any): Promise<any>;
    getDepartment(id: string): Promise<any>;
    createDepartment(body: {
        name: string;
        code: string;
        organisationId: string;
    }): Promise<any>;
    updateDepartment(id: string, body: {
        name?: string;
        code?: string;
    }): Promise<any>;
    deleteDepartment(id: string): Promise<any>;
    getDivisions(departmentId: string): Promise<any>;
    createDivision(departmentId: string, body: {
        name: string;
    }): Promise<any>;
    getDivisionUsers(departmentId: string, divisionId: string): Promise<any>;
}
