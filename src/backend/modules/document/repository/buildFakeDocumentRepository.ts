import { uniq } from 'lodash';
import { documentType } from '@src/core';
import { buildFakeRepositoryBuilder, projectFakeObjects, updateFakeCollection } from '../../../repository';
import { customDocumentRepositoryType } from './customDocumentRepositoryType';

export { buildFakeDocumentRepository };

const buildFakeDocumentRepository = buildFakeRepositoryBuilder<documentType, customDocumentRepositoryType>({
  collectionName: 'documents',
  buildCustomFakeRepository: (collection) => ({
    async countByStatus(status) {
      return collection.filter((document) => status.includes(document.status)).length;
    },

    async countNotIn(idsNotToSearchIn) {
      return collection.filter((document) => !idsNotToSearchIn.some((id) => id.equals(document._id))).length;
    },

    async findNotIn(idsNotToSearchIn) {
      return collection.filter((document) => !idsNotToSearchIn.some((id) => id.equals(document._id)));
    },

    async findAllPublicationCategories() {
      let publicationCategories: string[] = [];
      collection.forEach(
        (document) => (publicationCategories = uniq(publicationCategories.concat(document.publicationCategory))),
      );

      return publicationCategories;
    },

    async findAllByNACCodesAndStatus(
      NACCodes: documentType['decisionMetadata']['NACCode'][],
      statuses: documentType['status'][],
    ) {
      return collection.filter(
        (document) =>
          NACCodes.some((NACCode) => document.publicationCategory.includes(NACCode)) &&
          statuses.includes(document.status),
      );
    },

    async findAllByPublicationCategoryLettersAndStatus(publicationCategoryLetters, statuses) {
      return collection.filter(
        (document) =>
          publicationCategoryLetters.some((publicationCategoryLetter) =>
            document.publicationCategory.includes(publicationCategoryLetter),
          ) && statuses.includes(document.status),
      );
    },

    async findAllByPublicationCategoryLettersProjection(publicationCategoryLetters, projections) {
      return collection
        .filter((document) =>
          publicationCategoryLetters.some((publicationCategoryLetter) =>
            document.publicationCategory.includes(publicationCategoryLetter),
          ),
        )
        .map((document) => projectFakeObjects(document, projections));
    },

    async findAllByRoutesOrPublicationCategoryLettersProjection(routes, publicationCategoryLetters, projections) {
      return collection
        .filter(
          (document) =>
            publicationCategoryLetters.some((publicationCategoryLetter) =>
              document.publicationCategory.includes(publicationCategoryLetter),
            ) || routes.includes(document.route),
        )
        .map((document) => projectFakeObjects(document, projections));
    },

    async findAllByStatus(status) {
      return collection.filter((document) => status.includes(document.status));
    },

    async findAllByStatusProjection(status, projections) {
      return collection
        .filter((document) => status.includes(document.status))
        .map((document) => projectFakeObjects(document, projections));
    },

    async findOneByStatusAndPriorityNotIn({ status, priority }, idsNotToSearchIn) {
      const document = await collection.find(
        (document) =>
          document.status === status &&
          document.priority === priority &&
          !idsNotToSearchIn.some((id) => id.equals(document._id)),
      );
      return document || undefined;
    },

    async findOneByStatusWithoutLossNotIn(statuses, idsNotToSearchIn) {
      const document = await collection.find(
        (document) =>
          statuses.some((status: documentType['status']) => document.status === status) &&
          document.loss === undefined &&
          !idsNotToSearchIn.some((id) => id.equals(document._id)),
      );
      return document || undefined;
    },

    async findOneByDocumentNumberAndSource({ documentNumber, source }) {
      return collection.find((document) => document.source === source && document.documentNumber === documentNumber);
    },

    async findOneByExternalId(externalId) {
      const document = collection.find((document) => document.externalId === externalId);
      return document || undefined;
    },

    async findOneByStatusAndPriorityAmong({ status, priority }, idsToSearchInFirst) {
      const freeDocuments = collection
        .filter(
          (document) =>
            document.priority === priority &&
            document.status === status &&
            idsToSearchInFirst.some((id) => id.equals(document._id)),
        )
        .sort((documentA, documentB) => documentB.decisionMetadata.date || 0 - (documentA.decisionMetadata.date || 0));
      return freeDocuments[0];
    },

    async findOneRandomByStatusAndPriorityAmong({ status, priority }, idsToSearchInFirst) {
      const freeDocuments = collection.filter(
        (document) =>
          document.priority === priority &&
          document.status === status &&
          idsToSearchInFirst.some((id) => id.equals(document._id)),
      );

      const sortedByMostRecent = freeDocuments.sort(
        (documentA, documentB) => (documentB.decisionMetadata.date || 0) - (documentA.decisionMetadata.date || 0),
      );

      const mostRecentDocuments = sortedByMostRecent.slice(0, 50);

      const sortedByLeastRecent = freeDocuments.sort(
        (documentA, documentB) => (documentA.decisionMetadata.date || 0) - (documentB.decisionMetadata.date || 0),
      );

      const leastRecentDocuments = sortedByLeastRecent.slice(0, 50);

      const combinedDocuments = mostRecentDocuments.concat(leastRecentDocuments);

      if (combinedDocuments.length === 0) {
        return undefined;
      }

      return combinedDocuments[Math.floor(Math.random() * combinedDocuments.length)];
    },

    async findByStatusAndPriorityLimitAmong({ status, priority }, limit, idsToSearchInFirst) {
      const documents = collection
        .filter(
          (document) =>
            document.priority === priority &&
            document.status === status &&
            idsToSearchInFirst.some((id) => id.equals(document._id)),
        )
        .sort((documentA, documentB) => (documentB.decisionMetadata.date || 0) - (documentA.decisionMetadata.date || 0))
        .slice(0, limit);
      return documents;
    },

    async updateRouteById(_id, route) {
      updateFakeCollection(
        collection,
        collection.map((document) =>
          _id.equals(document._id)
            ? {
                ...document,
                route,
              }
            : document,
        ),
      );
      const updatedDocument = collection.find((document) => _id.equals(document._id));

      return updatedDocument;
    },

    async updateStatusById(_id, status) {
      updateFakeCollection(
        collection,
        collection.map((document) =>
          _id.equals(document._id)
            ? {
                ...document,
                status,
                updateDate: new Date().getTime(),
              }
            : document,
        ),
      );
      const updatedDocument = collection.find((document) => _id.equals(document._id));

      return updatedDocument;
    },
    async updateOneStatusByIdAndStatus(filter, update) {
      updateFakeCollection(
        collection,
        collection.map((document) =>
          filter._id.equals(document._id) && document.status === filter.status
            ? {
                ...document,
                status: update.status,
                updateDate: new Date().getTime(),
              }
            : document,
        ),
      );

      const updatedDocument = collection.find((document) => filter._id.equals(document._id));

      return updatedDocument;
    },
  }),
});
