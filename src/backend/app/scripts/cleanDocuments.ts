import { withMongo } from './withMongo';
import { logger } from '../../utils';
import { cleanAssignations } from './cleanDocuments/cleanAssignations';
import { cleanAssignedDocuments } from './cleanDocuments/cleanAssignedDocuments';
import { cleanFreeDocuments } from './cleanDocuments/cleanFreeDocuments';
import { cleanOrphansTreatments } from './cleanDocuments/cleanOrphansTreatments';

export { cleanDocuments };

if (require.main === module) {
  (async () => {
    await withMongo(cleanDocuments);
  })();
}

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
