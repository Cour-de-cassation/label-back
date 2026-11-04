import { ObjectId } from 'mongodb';
import { preAssignationModule, preAssignationType } from '@src/core';
import {
  deletePreAssignationById,
  findPreAssignation,
  findPreAssignationsWithUserName,
  insertPreAssignation,
} from '../../../connectors/db/preAssignations';

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

  fetchAllPreAssignation: findPreAssignationsWithUserName,

  async fetchPreAssignationBySourceAndNumber(number: string, source: string) {
    return findPreAssignation({ number, source });
  },
};
