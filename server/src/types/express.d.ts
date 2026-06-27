// Attach the authenticated user id to Express requests (set by auth middleware).
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
