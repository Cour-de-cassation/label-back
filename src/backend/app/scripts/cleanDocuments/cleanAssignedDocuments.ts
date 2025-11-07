import { buildAssignationRepository } from '../../../modules/assignation';
import { documentService, buildDocumentRepository } from '../../../modules/document';
import { logger } from '../../../utils';
import { ObjectId } from 'mongodb';

export { cleanAssignedDocuments };

/**
 * Set the document status to free if no assignation found for
 * pending or saved document
 */
async function cleanAssignedDocuments() {
  logger.log({ operationName: 'cleanAssignedDocuments', msg: 'START' });
  const documentRepository = buildDocumentRepository();
  const assignedDocuments = await documentRepository.findAllByStatusProjection(['pending', 'saved'], ['_id', 'status']);

  const assignationRepository = buildAssignationRepository();
  const assignations = await assignationRepository.findAllProjection(['_id', 'documentId']);

  logger.log({
    operationName: 'cleanAssignedDocuments',
    msg: 'Start checking all assigned documents',
  });

  await Promise.all(
    assignedDocuments.map(async (document) => {
      const assignation = assignations.find(({ documentId }) => documentId.equals(new ObjectId(document._id)));
      if (!assignation) {
        logger.log({
          operationName: 'cleanAssignedDocuments',
          msg: `Inconsistency: assignation not found for document status ${document.status}. Resetting the document to free...`,
        });
        await documentService.updateDocumentStatus(document._id, 'free');
      }
      return;
    }),
  );
  logger.log({ operationName: 'cleanAssignedDocuments', msg: 'DONE' });
}
