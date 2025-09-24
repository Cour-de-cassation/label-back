import { userType } from '@src/core';

export type { customUserRepositoryType };

type customUserRepositoryType = {
  findByEmail: (email: userType['email']) => Promise<userType | null>;
  updateNameAndRoleById: (
    userId: userType['_id'],
    name: userType['name'],
    role: userType['role'],
  ) => Promise<{ success: boolean }>;
};
