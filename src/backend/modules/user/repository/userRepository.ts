import { userType } from '@src/core';
import { genericRepository } from '@src/backend/repository/genericRepository';
import { ObjectId } from 'mongodb';
import { mongo } from '@src/backend/utils';

export { userRepository };

function userRepository() {
  const db = mongo.getDb();
  const collection = db.collection<userType>('users');

  return {
    ...genericRepository<userType>('users'),
    updateNameAndRoleById,
  };

  async function updateNameAndRoleById(userId: ObjectId, name: string, role: userType['role']) {
    await collection.updateOne({ _id: userId } as any, { $set: { name, role } });
    const updatedUser = await collection.findOne({ _id: userId } as any);
    return updatedUser || undefined;
  }
}
