import { logger } from '../../../utils';
import { cleanAssignations } from './cleanAssignations';
import { cleanAssignedDocuments } from './cleanAssignedDocuments';
import { cleanFreeDocuments } from './cleanFreeDocuments';
import { cleanOrphansTreatments } from './cleanOrphansTreatments';

export { cleanDocuments };

async function cleanDocuments() {
  logger.info({
    operations: ['other', 'cleanDocuments'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanDocuments.ts',
    message: 'START',
  });

  await cleanAssignedDocuments();

  await cleanAssignations();

  await cleanFreeDocuments();

  await cleanOrphansTreatments();

  logger.info({
    operations: ['other', 'cleanDocuments'],
    path: 'src/backend/app/scripts/cleanDocuments/cleanDocuments.ts',
    message: 'DONE',
  });
}
