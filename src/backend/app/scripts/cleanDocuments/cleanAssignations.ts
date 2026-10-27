import { TechLog } from '@src/backend/utils/logger/loggerType';
import { logger } from '../../../utils';
import { forEachBatch } from '../../../connectors/db/batch';
import { deleteAssignations, findAssignationsOfMissingOrFreeDocuments } from '../../../connectors/db/assignations';
import { deleteTreatments } from '../../../connectors/db/treatments';

export { cleanAssignations };

/**
 * Delete the assignations (and their treatments) linked to a document
 * which does not exist anymore or is free
 */
async function cleanAssignations() {
  const loggerTech: TechLog = {
    operations: ['other', 'cleanAssignations'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanAssignations.ts',
    message: 'START',
  };
  logger.info(loggerTech);

  const deletedCount = await forEachBatch(findAssignationsOfMissingOrFreeDocuments(), async (assignations) => {
    await deleteTreatments({ _id: { $in: assignations.map(({ treatmentId }) => treatmentId) } });
    await deleteAssignations({ _id: { $in: assignations.map(({ _id }) => _id) } });
  });

  logger.info({
    ...loggerTech,
    message: `DONE: ${deletedCount} assignations of missing or free documents deleted with their treatments`,
  });
}
