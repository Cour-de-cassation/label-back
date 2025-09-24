import { userType } from '@src/core';
import { buildRepositoryBuilder } from '../../../repository';
import { customUserRepositoryType } from './customUserRepositoryType';

export { buildUserRepository };

const buildUserRepository = buildRepositoryBuilder<
  userType,
  customUserRepositoryType
>({
  collectionName: 'users',
  indexes: [
    {
      index: {
        email: 1,
      },
      mustBeUnique: true,
    } as const,
  ],
  buildCustomRepository: (collection) => ({
    async findByEmail(email) {
      const formattedEmail = email.trim().toLowerCase();
      const result = await collection.findOne({ email: formattedEmail });
      return result;
    },
    async updateNameAndRoleById(userId, name, role) {
      const { acknowledged } = await collection.updateOne(
        { _id: userId },
        { $set: { name, role } },
      );
      return {
        success: acknowledged,
      };
    },
  }),
});
