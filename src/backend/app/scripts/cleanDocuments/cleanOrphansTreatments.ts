import { dateBuilder } from '@src/core';
import { deleteTreatmentById, findTreatments } from '../../../connectors/db/treatments';
import { logger } from '../../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';
import { findDocumentById } from '../../../connectors/db/documents';

export { cleanOrphansTreatments };

/**
 * Clean treatments with no document associated
 */

async function cleanOrphansTreatments() {
  const logerTech: TechLog = {
    operations: ['other', 'cleanOrphansTreatments'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanOrphansTreatments.ts',
    message: 'cleanOrphansTreatments',
  };
  logger.info({
    ...logerTech,
    message: 'START',
  });

  const date = dateBuilder.monthsAgo(6);

  const treatments = await findTreatments({ lastUpdateDate: { $lt: date } });
  logger.info({
    ...logerTech,
    message: `Find ${treatments.length} treatments with lastUpdateDate more than 6 months ago.`,
  });

  for (let i = 0; i < treatments.length; i++) {
    try {
      await findDocumentById(treatments[i].documentId);
    } catch (_) {
      logger.error({
        ...logerTech,
        message: `Document NOT found for treatment ${treatments[i]._id}`,
      });
      await deleteTreatmentById(treatments[i]._id);
      logger.info({
        ...logerTech,
        message: `Treatment ${treatments[i]._id} deleted`,
      });
    }
  }

  logger.info({ ...logerTech, message: 'DONE' });
}
