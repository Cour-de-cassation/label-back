import { TechLog } from '@src/backend/utils/logger/loggerType';
import { logger } from '../../../utils';
import { forEachBatch } from '../../../connectors/db/batch';
import {
  findAssignedDocumentIdsWithoutAssignation,
  updateDocumentsStatusByIds,
} from '../../../connectors/db/documents';

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

  let freedCount = 0;
  const inconsistentCount = await forEachBatch(findAssignedDocumentIdsWithoutAssignation(), async (documents) => {
    freedCount += await updateDocumentsStatusByIds(
      documents.map(({ _id }) => _id),
      'free',
      { status: { $in: ['pending', 'saved'] } },
    );
  });

  logger.info({
    ...loggerTech,
    message: `DONE: ${inconsistentCount} pending or saved documents without assignation, ${freedCount} reset to free`,
  });
}
