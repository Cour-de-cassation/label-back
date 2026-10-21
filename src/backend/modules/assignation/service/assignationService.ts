import { ObjectId } from 'mongodb';
import { assignationModule, assignationType, documentType, indexer, treatmentModule, userType } from '@src/core';
import {
  deleteAssignationById,
  deleteAssignations,
  findAssignation,
  findAssignations,
  insertAssignation,
} from '../../../connectors/db/assignations';
import { deleteTreatmentById, deleteTreatments } from '../../../connectors/db/treatments';
import { documentService } from '../../document';
import { treatmentService } from '../../treatment';
import { userService } from '../../user';

export { assignationService };

async function getAssignation(_id: assignationType['_id']) {
  const assignation = await findAssignation({ _id });
  if (!assignation) {
    throw new Error(`No matching assignations for _id ${_id}`);
  }
  return assignation;
}

const assignationService = {
  async assertDocumentIsAssignatedToUser({
    documentId,
    userId,
  }: {
    documentId: documentType['_id'];
    userId: userType['_id'];
  }) {
    const assignation = await findAssignation({ documentId, userId });

    if (!assignation) {
      throw new Error(`No assignation found for userId ${userId} and documentId ${documentId}`);
    }
  },

  async createAssignation({ userId, documentId }: { userId: ObjectId; documentId: ObjectId }) {
    const userRole = await userService.fetchUserRole(userId);

    if (userRole === 'publicator' || userRole === 'scrutator') {
      throw new Error(`User ${userId.toHexString()} is a ${userRole} and is trying to create an assignation`);
    }

    const treatmentId = await treatmentService.createEmptyTreatment({ documentId, source: userRole });

    const assignation = assignationModule.lib.buildAssignation({
      userId,
      documentId,
      treatmentId,
      assignationDate: new Date().getTime(),
    });

    await insertAssignation(assignation);

    return assignation;
  },

  async deleteAssignation(assignationId: assignationType['_id']) {
    const assignation = await getAssignation(assignationId);
    await deleteTreatmentById(assignation.treatmentId);
    await deleteAssignationById(assignationId);
  },

  async deleteAssignationsByDocumentId(documentId: documentType['_id']) {
    const assignationsToDelete = await findAssignations({ documentId });

    await deleteTreatments({ _id: { $in: assignationsToDelete.map(({ treatmentId }) => treatmentId) } });
    await deleteAssignations({ _id: { $in: assignationsToDelete.map(({ _id }) => _id) } });
  },

  fetchAssignation: getAssignation,

  async fetchAllAssignationsById(assignationIds?: assignationType['_id'][]) {
    const assignations = await findAssignations(assignationIds ? { _id: { $in: assignationIds } } : {});
    const assignationsById = indexer.indexBy(assignations, (assignation) => assignation._id.toHexString());

    if (assignationIds) {
      indexer.assertEveryIdIsDefined(
        assignationIds.map((assignationId) => assignationId.toHexString()),
        assignationsById,
        (_id) => `The assignation id ${_id} has no matching assignation`,
      );
    }

    return assignationsById;
  },

  async fetchAssignationId({ userId, documentId }: { userId: ObjectId; documentId: ObjectId }) {
    const assignation = await findAssignation({ userId, documentId });
    return assignation?._id;
  },

  async fetchAssignationsByDocumentIds(
    documentIdsToSearchIn: ObjectId[],
    options: { assertEveryDocumentIsAssigned: boolean },
  ) {
    const assignations = await findAssignations({ documentId: { $in: documentIdsToSearchIn } });
    const assignationsByDocumentIds = indexer.indexManyBy(assignations, (assignation) =>
      assignation.documentId.toHexString(),
    );

    if (options?.assertEveryDocumentIsAssigned) {
      indexer.assertEveryIdIsDefined(
        documentIdsToSearchIn.map((documentId) => documentId.toHexString()),
        assignationsByDocumentIds,
        (_id) => `The document ${_id} has no matching assignations`,
      );
    }
    return assignationsByDocumentIds;
  },

  async fetchAssignationsOfDocumentId(documentId: ObjectId): Promise<assignationType[]> {
    return findAssignations({ documentId });
  },

  async fetchDocumentIdsAssignatedToUserId(
    userId: userType['_id'],
  ): Promise<Array<{ documentId: documentType['_id']; assignationId: assignationType['_id'] }>> {
    const assignations = await findAssignations({ userId });

    return assignations.map((assignation) => ({
      documentId: assignation.documentId,
      assignationId: assignation._id,
    }));
  },

  async findOrCreateByDocumentIdAndUserId({
    documentId,
    userId,
  }: {
    documentId: documentType['_id'];
    userId: userType['_id'];
  }) {
    const treatments = await treatmentService.fetchTreatmentsByDocumentId(documentId);
    const lastTreatment = treatmentModule.lib.getLastTreatment(treatments);
    const assignation = !!lastTreatment && (await findAssignation({ treatmentId: lastTreatment._id }));
    if (assignation && assignation.userId.equals(userId)) {
      return assignation;
    }

    return assignationService.createAssignation({ documentId, userId });
  },

  async updateAssignationDocumentStatus(assignationId: assignationType['_id'], status: documentType['status']) {
    const assignation = await getAssignation(assignationId);
    return documentService.updateDocumentStatus(assignation.documentId, status);
  },
};
