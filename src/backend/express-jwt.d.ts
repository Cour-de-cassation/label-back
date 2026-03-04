declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name: string;
        role: string;
        email: string;
        sessionIndex: string;
      };
    }
  }
}

export {};
