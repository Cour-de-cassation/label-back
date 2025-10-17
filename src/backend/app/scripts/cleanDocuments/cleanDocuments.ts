import { logger } from '../../../utils';
import { cleanAssignations } from './cleanAssignations';
import { cleanAssignedDocuments } from './cleanAssignedDocuments';
import { cleanFreeDocuments } from './cleanFreeDocuments';
import { cleanOrphansTreatments } from './cleanOrphansTreatments';

export { cleanDocuments };

async function cleanDocuments() {
  logger.log({ operationName: 'cleanDocuments', msg: 'START' });

  await cleanAssignedDocuments();

  await cleanAssignations();

  await cleanFreeDocuments();

  await cleanOrphansTreatments();

  logger.log({ operationName: 'cleanDocuments', msg: 'DONE' });
}
