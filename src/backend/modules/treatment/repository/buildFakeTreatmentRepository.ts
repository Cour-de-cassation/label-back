import { indexer, treatmentType } from '@src/core';
import { buildFakeRepositoryBuilder, updateFakeCollection } from '../../../repository';
import { customTreatmentRepositoryType } from './customTreatmentRepositoryType';

export { buildFakeTreatmentRepository };

const buildFakeTreatmentRepository = buildFakeRepositoryBuilder<treatmentType, customTreatmentRepositoryType>({
  collectionName: 'treatments',
  buildCustomFakeRepository: (collection) => ({
    async countByDocumentId(documentId) {
      return collection.filter((treatment) => documentId.equals(treatment.documentId)).length;
    },
    async deleteByDocumentId(documentId) {
      updateFakeCollection(
        collection,
        collection.filter((treatment) => !treatment.documentId.equals(documentId)),
      );
    },

    async findAllByDocumentId(documentId) {
      return collection.filter((treatment) => treatment.documentId.equals(documentId));
    },

    async findAllByDocumentIds(documentIds) {
      const treatments = collection
        .filter((treatment) => documentIds.some((documentId) => documentId.equals(treatment.documentId)))
        .sort((treatmentA, treatmentB) => treatmentA.order - treatmentB.order);
      return indexer.indexManyBy(treatments, (treatment) => treatment.documentId.toHexString());
    },

    async findExtremumLastUpdateDateBySources(sources) {
      if (collection.length === 0) {
        return { minDate: undefined, maxDate: undefined };
      }
      const sortedItems = collection
        .filter(({ source }) => sources.includes(source))
        .sort((item1, item2) => item1.lastUpdateDate - item2.lastUpdateDate);
      return {
        minDate: sortedItems[0].lastUpdateDate,
        maxDate: sortedItems[sortedItems.length - 1].lastUpdateDate,
      };
    },

    async findAllByLastUpdateDateLessThan(date) {
      return collection.filter(({ lastUpdateDate }) => date < lastUpdateDate);
    },
  }),
});
