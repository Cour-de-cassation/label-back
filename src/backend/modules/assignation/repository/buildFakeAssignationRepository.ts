import { assignationType, indexer } from '@src/core';
import { buildFakeRepositoryBuilder } from '../../../repository';
import { customAssignationRepositoryType } from './customAssignationRepositoryType';

export { buildFakeAssignationRepository };

const buildFakeAssignationRepository = buildFakeRepositoryBuilder<assignationType, customAssignationRepositoryType>({
  collectionName: 'assignations',
  buildCustomFakeRepository: (collection) => ({
    async findAllByUserId(userId) {
      return collection.filter((assignation) => assignation.userId.equals(userId));
    },

    async findAllByDocumentIds(documentIdsToSearchIn) {
      const assignations = collection.filter((assignation) =>
        documentIdsToSearchIn.some((documentId) => documentId.equals(assignation.documentId)),
      );

      return indexer.indexManyBy(assignations, (assignation) => assignation.documentId.toHexString());
    },

    async findByDocumentIdAndUserId({ documentId, userId }) {
      const result = collection.find(
        (assignation) => assignation.documentId.equals(documentId) && assignation.userId.equals(userId),
      );

      return result;
    },

    async findAllByDocumentId(documentId) {
      return collection.filter((assignation) => assignation.documentId.equals(documentId));
    },

    async findByTreatmentId(treatmentId) {
      return collection.find((assignation) => assignation.treatmentId.equals(treatmentId));
    },
  }),
});
