import { ObjectId } from 'mongodb';
import { assignationType, indexer, userModule, userType } from '@src/core';
import { findUser, findUsers, insertUser, updateUserById } from '../../../connectors/db/users';

export { userService };

const DEFAULT_ROLE = 'annotator';

const userService = {
  async createUser({ name, email, role }: { name: string; email: string; role: userType['role'] }) {
    await userService.signUpUser({ name, email, role });
    return `User created successfully `;
  },

  async signUpUser({ email, name, role = DEFAULT_ROLE }: { email: string; name: string; role?: userType['role'] }) {
    const newUser = await userModule.lib.buildUser({ email, name, role });
    await insertUser(newUser);
  },

  async updateUser({ userId, name, role }: { userId: userType['_id']; name: string; role: userType['role'] }) {
    await updateUserById(userId, { name, role });
    return { success: true };
  },

  async fetchUserByEmail(email: userType['email']) {
    return findUser({ email: email.trim().toLowerCase() });
  },

  async fetchUserRole(userId: userType['_id']) {
    const user = await findUser({ _id: userId });
    if (!user) {
      throw new Error(`No matching users for _id ${userId}`);
    }
    return user.role;
  },

  async fetchUsers() {
    const users = await findUsers();
    return indexer.indexBy(users, (user) => user._id.toHexString());
  },

  async fetchUsersByIds(userIds: ObjectId[]) {
    const users = await findUsers({ _id: { $in: userIds } });
    const usersById = indexer.indexBy(users, (user) => user._id.toHexString());

    indexer.assertEveryIdIsDefined(
      userIds.map((userId) => userId.toHexString()),
      usersById,
      (_id) => `Couldn't find the user with id: ${_id}`,
    );
    return usersById;
  },

  async fetchUsersByAssignations(assignations: assignationType[]) {
    const users = await findUsers({ _id: { $in: assignations.map(({ userId }) => userId) } });
    const usersById = indexer.indexBy(users, (user) => user._id.toHexString());

    const usersByAssignationId = indexer.mapIndexBy(
      assignations,
      (assignation) => assignation._id.toHexString(),
      (assignation) => usersById[assignation.userId.toHexString()],
    );

    indexer.assertEveryIdIsDefined(
      assignations.map((assignation) => assignation._id.toHexString()),
      usersByAssignationId,
      (_id) => `The assignation ${_id} has no matching user`,
    );
    return usersByAssignationId;
  },

  async fetchWorkingUsers() {
    const users = await findUsers();

    if (users.length === 0) {
      throw new Error('No users found');
    }

    return users.map(({ _id, email, name, role }) => ({ _id, email, name, role }));
  },
};
