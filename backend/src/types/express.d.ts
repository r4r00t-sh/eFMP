import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & { department?: unknown; division?: unknown };
    }
  }
}

export {};
