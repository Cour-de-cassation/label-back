import { assignationType, documentModule, documentType } from '@src/core';
import { logger } from '../../../utils';
import { assignationService } from '../../assignation';
import { findAssignedDocumentsOfUser } from '../../../connectors/db/assignations';
import { findDocuments, updateDocument } from '../../../connectors/db/documents';
import { Filter, ObjectId } from 'mongodb';

export { buildFetchDocumentsForUser };

function buildFetchDocumentsForUser(checkCallAttempts: (identifier: string) => void) {
  return fetchDocumentsForUser;

  async function fetchDocumentsForUser(userId: ObjectId, documentsMaxCount: number) {
    const documents: Array<{
      document: documentType;
      assignationId: assignationType['_id'];
    }> = [];

    // Documents already assignated to the user are fetched
    const alreadyAssignatedDocuments = await findAssignedDocumentsOfUser(new ObjectId(userId));
    for (let i = 0; i < alreadyAssignatedDocuments.length && i < documentsMaxCount; i++) {
      checkCallAttempts(userId.toHexString());
      const alreadyAssignatedDocument = alreadyAssignatedDocuments[i];
      documents.push(alreadyAssignatedDocument);
    }

    // If at least one document has the 'saved' status means that the anotator is currently annotating a document
    if (documents.some(({ document }) => document.status === 'saved')) {
      return documents;
    }

    // We fill the pool of assignated documents with new ones
    for (let i = documents.length; i < documentsMaxCount; i++) {
      try {
        const assignatedDocument = await fetchDocumentForUser(new ObjectId(userId));
        documents.push(assignatedDocument);
      } catch (error) {
        logger.error({
          operations: ['other', 'fetchDocumentsForUser'],
          path: 'src/backend/modules/document/service/fetchDocumentsForUser.ts',
          message: 'Error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
    return documents;
  }

  async function fetchDocumentForUser(userId: ObjectId): Promise<{
    document: documentType;
    assignationId: assignationType['_id'];
  }> {
    checkCallAttempts(userId.toHexString());

    let document: documentType | undefined;

    // Get document by priority
    for (let priority = 4; priority >= 0; priority--) {
      document = await assignDocumentByPriority(priority);
      if (document) {
        break;
      }
    }
    if (!document) {
      throw new Error(`No free document available`);
    }

    const assignation = await assignationService.createAssignation({
      userId,
      documentId: document._id,
    });

    return { document, assignationId: assignation._id };
  }

  async function assignDocumentByPriority(
    priority: documentType['priority'],
    documentIdsToExclude: documentType['_id'][] = [],
  ): Promise<documentType | undefined> {
    const filter = {
      priority,
      status: 'free',
      _id: { $nin: documentIdsToExclude },
    } satisfies Filter<documentType>;

    const [oldest, newest] = await Promise.all([
      findDocuments(filter, 50, { field: 'decisionMetadata.date', direction: 1 }),
      findDocuments(filter, 50, { field: 'decisionMetadata.date', direction: -1 }),
    ]);

    const recentAndOldDocuments = [...oldest, ...newest];
    const document = recentAndOldDocuments[Math.floor(Math.random() * recentAndOldDocuments.length)];

    if (!document) {
      return undefined;
    }
    if ((await assignationService.fetchAssignationsOfDocumentId(document?._id)).length != 0) {
      // If the document is assignated, exclude it from the search
      return assignDocumentByPriority(priority, [...documentIdsToExclude, document._id]);
    }

    const nextStatus = documentModule.lib.getNextStatus({
      status: document.status,
      route: document.route,
    });

    const updatedDocument = await updateDocument(
      { _id: document._id, status: 'free' },
      { status: nextStatus, updateDate: new Date().getTime() },
    );
    if (updatedDocument?.status !== nextStatus) {
      return assignDocumentByPriority(priority, documentIdsToExclude);
    }
    return updatedDocument;
  }
}
