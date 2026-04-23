import { documentType } from '@src/core';
import { assignationService, buildAssignationRepository } from '../../../modules/assignation';
import { buildDocumentRepository } from '../../../modules/document';
import { logger } from '../../../utils';
import { ObjectId } from 'mongodb';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { cleanAssignations };

/**
 * Delete all the assignations linked to a document
 * which is either loaded, being annotated by the NLP engine, or free
 */
async function cleanAssignations() {
  const loggerTech: TechLog = {
    operations: ['other', 'cleanAssignations'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanAssignations.ts',
    message: 'START',
  };
  logger.info(loggerTech);
  const FORBIDDEN_STATUSES_FOR_ASSIGNATED_DOCUMENT: documentType['status'][] = ['free'];
  const documentRepository = buildDocumentRepository();
  const assignationRepository = buildAssignationRepository();

  const documents = await documentRepository.findAllProjection(['_id', 'status']);
  const assignations = await assignationRepository.findAllProjection(['_id', 'documentId']);
  logger.info({
    ...loggerTech,
    message: `Start checking all assignations`,
  });

  await Promise.all(
    assignations.map(async (assignation) => {
      const document = documents.find(({ _id }) => _id.equals(new ObjectId(assignation.documentId)));
      if (!document || FORBIDDEN_STATUSES_FOR_ASSIGNATED_DOCUMENT.includes(document.status)) {
        logger.info({
          ...loggerTech,
          message: `Inconsistency: document not found or status inconsistent. Deleting the assignation...`,
        });
        await assignationService.deleteAssignation(assignation._id);
      }
      return;
    }),
  );
  logger.info({ ...loggerTech, message: 'DONE' });
}
