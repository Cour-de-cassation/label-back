import { ObjectId } from 'mongodb';
import { preAssignationModule, preAssignationType } from '@src/core';
import {
  deletePreAssignationById,
  findPreAssignation,
  findPreAssignations,
  insertPreAssignation,
} from '../../../connectors/db/preAssignations';
import { userService } from '../../user';

export { preAssignationService };

const preAssignationService = {
  async createPreAssignation({ userId, source, number }: { userId: ObjectId; source: string; number: string }) {
    const preAssignation = preAssignationModule.lib.buildPreAssignation({
      userId,
      source,
      number,
      creationDate: new Date().getTime(),
    });
    await insertPreAssignation(preAssignation);
    return preAssignation;
  },

  async deletePreAssignation(preAssignationId: preAssignationType['_id']) {
    await deletePreAssignationById(preAssignationId);
  },

  async fetchAllPreAssignation() {
    const preAssignations = await findPreAssignations();
    const usersByIds = await userService.fetchUsersByIds(preAssignations.map(({ userId }) => userId));

    return preAssignations.map((preAssignation) => ({
      preAssignation,
      userName: usersByIds[preAssignation.userId.toHexString()].name,
    }));
  },

  async fetchPreAssignationBySourceAndNumber(number: string, source: string) {
    return findPreAssignation({ number, source });
  },
};
