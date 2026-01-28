import { PrismaService } from '../prisma/prisma.service';
export declare class NotesController {
    private prisma;
    constructor(prisma: PrismaService);
    createNote(fileId: string, req: any, body: {
        content: string;
    }): Promise<any>;
}
