import { dateBuilder } from '@src/core';
import { TechLog } from '@src/backend/utils/logger/loggerType';
import { logger } from '../../../utils';
import { forEachBatch } from '../../../connectors/db/batch';
import { deleteTreatments, findOrphanTreatmentIdsUpdatedBefore } from '../../../connectors/db/treatments';

export { cleanOrphansTreatments };

/**
 * Delete the treatments last updated more than 6 months ago with no document associated
 */
async function cleanOrphansTreatments() {
  const loggerTech: TechLog = {
    operations: ['other', 'cleanOrphansTreatments'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanOrphansTreatments.ts',
    message: 'START',
  };
  logger.info(loggerTech);

  const deletedCount = await forEachBatch(
    findOrphanTreatmentIdsUpdatedBefore(dateBuilder.monthsAgo(6)),
    async (treatments) => {
      await deleteTreatments({ _id: { $in: treatments.map(({ _id }) => _id) } });
    },
  );

  logger.info({ ...loggerTech, message: `DONE: ${deletedCount} orphan treatments deleted` });
}
