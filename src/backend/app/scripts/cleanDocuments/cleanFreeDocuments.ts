import { TechLog } from '@src/backend/utils/logger/loggerType';
import { assignationService } from '../../../modules/assignation';
import { logger } from '../../../utils';
import { findDocumentsProjection } from '../../../connectors/db/documents';

export { cleanFreeDocuments };

/**
 * Delete all assignations for free documents
 */
async function cleanFreeDocuments() {
  const logerTech: TechLog = {
    operations: ['other', 'cleanFreeDocuments'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanFreeDocuments.ts',
    message: 'cleanFreeDocuments',
  };
  logger.info({
    ...logerTech,
    message: 'START',
  });

  const freeDocuments = await findDocumentsProjection({ status: 'free' }, ['_id']);
  logger.info({
    ...logerTech,
    message: `${freeDocuments.length} free documents found. ${JSON.stringify({ freeDocumentsCount: freeDocuments.length })}`,
  });
  const freeDocumentIds = freeDocuments.map(({ _id }) => _id);
  logger.info({
    ...logerTech,
    message: 'Deleting assignations and their treatments for free documents',
  });

  for (let i = 0, length = freeDocumentIds.length; i < length; i++) {
    await assignationService.deleteAssignationsByDocumentId(freeDocumentIds[i]);
  }

  logger.info({
    ...logerTech,
    message: 'DONE',
  });
}
