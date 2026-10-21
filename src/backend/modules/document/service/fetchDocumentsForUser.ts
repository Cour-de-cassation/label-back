import { assignationType, documentModule, documentType, userType } from '@src/core';
import { indexer } from '@src/core';
import { logger } from '../../../utils';
import { assignationService } from '../../assignation';
import { treatmentService } from '../../treatment';
import { findDocuments, findRandomDocument, updateDocument } from '../../../connectors/db/documents';
import { ObjectId } from 'mongodb';

export { buildFetchDocumentsForUser };

function buildFetchDocumentsForUser(checkCallAttempts: (identifier: string) => void) {
  return fetchDocumentsForUser;

  async function fetchDocumentsForUser(userId: ObjectId, documentsMaxCount: number) {
    const documents: Array<{
      document: documentType;
      assignationId: assignationType['_id'];
    }> = [];

    // We get all documents that can be assigned
    const documentIdsWithAnnotations = await treatmentService.fetchTreatedDocumentIds();

    // Documents already assignated to the user are fetched
    const alreadyAssignatedDocuments = await fetchAlreadyAssignatedDocuments(new ObjectId(userId));
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
        const assignatedDocument = await fetchDocumentForUser(new ObjectId(userId), documentIdsWithAnnotations);
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

  async function fetchDocumentForUser(
    userId: ObjectId,
    documentIdsToSearchIn: documentType['_id'][],
  ): Promise<{
    document: documentType;
    assignationId: assignationType['_id'];
  }> {
    checkCallAttempts(userId.toHexString());

    return assignNewDocument(documentIdsToSearchIn);

    async function assignNewDocument(documentIdsToSearchIn: documentType['_id'][]): Promise<{
      document: documentType;
      assignationId: assignationType['_id'];
    }> {
      let document: documentType | undefined;

      // Get document by priority
      for (let priority = 4; priority >= 0; priority--) {
        document = await assignDocumentByPriority(priority, documentIdsToSearchIn);
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
  }

  async function assignDocumentByPriority(
    priority: documentType['priority'],
    documentIdsToSearchIn: documentType['_id'][],
  ): Promise<documentType | undefined> {
    const document = await findRandomDocument({ priority, status: 'free', _id: { $in: documentIdsToSearchIn } });

    if (!document) {
      return undefined;
    }
    if ((await assignationService.fetchAssignationsOfDocumentId(document?._id)).length != 0) {
      // If the document is assignated, remove the document from the list
      documentIdsToSearchIn = documentIdsToSearchIn.filter((documentId) => !documentId.equals(document?._id));
      return assignDocumentByPriority(priority, documentIdsToSearchIn);
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
      return assignDocumentByPriority(priority, documentIdsToSearchIn);
    }
    return updatedDocument;
  }

  async function fetchAlreadyAssignatedDocuments(userId: userType['_id']): Promise<
    Array<{
      document: documentType;
      assignationId: assignationType['_id'];
    }>
  > {
    const documentIdsAssignated = await assignationService.fetchDocumentIdsAssignatedToUserId(userId);

    const assignatedDocuments = await findDocuments({
      _id: { $in: documentIdsAssignated.map(({ documentId }) => documentId) },
    });
    const documentsById = indexer.indexBy(assignatedDocuments, ({ _id }) => _id.toHexString());
    return documentIdsAssignated
      .map(({ documentId, assignationId }) => ({
        document: documentsById[documentId.toHexString()],
        assignationId,
      }))
      .filter(({ document }) => document.status === 'pending' || document.status === 'saved')
      .sort(({ document: document1 }, { document: document2 }) =>
        document1.status === 'saved' ? -1 : document2.status === 'saved' ? 1 : 0,
      );
  }
}
