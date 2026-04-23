import { buildAssignationRepository } from '../../../modules/assignation';
import { documentService, buildDocumentRepository } from '../../../modules/document';
import { logger } from '../../../utils';
import { ObjectId } from 'mongodb';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { cleanAssignedDocuments };

/**
 * Set the document status to free if no assignation found for
 * pending or saved document
 */
async function cleanAssignedDocuments() {
  const loggerTech: TechLog = {
    operations: ['other', 'cleanAssignedDocuments'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanAssignedDocuments.ts',
    message: 'START',
  };
  logger.info(loggerTech);
  const documentRepository = buildDocumentRepository();
  const assignedDocuments = await documentRepository.findAllByStatusProjection(['pending', 'saved'], ['_id', 'status']);

  const assignationRepository = buildAssignationRepository();
  const assignations = await assignationRepository.findAllProjection(['_id', 'documentId']);

  logger.info({
    ...loggerTech,
    message: 'Start checking all assigned documents',
  });

  await Promise.all(
    assignedDocuments.map(async (document) => {
      const assignation = assignations.find(({ documentId }) => documentId.equals(new ObjectId(document._id)));
      if (!assignation) {
        logger.info({
          ...loggerTech,
          message: `Inconsistency: assignation not found for document status ${document.status}. Resetting the document to free...`,
        });
        await documentService.updateDocumentStatus(document._id, 'free');
      }
      return;
    }),
  );
  logger.info({ ...loggerTech, message: 'DONE' });
}
