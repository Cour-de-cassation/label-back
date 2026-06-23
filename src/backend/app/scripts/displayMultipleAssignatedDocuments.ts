import { withMongo } from './withMongo';
import { logger } from '../../utils';
import { assignationService } from '../../modules/assignation';
import { buildDocumentRepository } from '../../modules/document';
import { userService } from '../../modules/user';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { displayMultipleAssignatedDocuments };

if (require.main === module) {
  (async () => {
    await withMongo(displayMultipleAssignatedDocuments);
  })();
}

async function displayMultipleAssignatedDocuments() {
  const loggerTech: TechLog = {
    operations: ['other', 'displayMultipleAssignatedDocuments'],
    path: './src/backend/app/scripts/displayMultipleAssignatedDocuments.ts',
    message: 'displayMultipleAssignatedDocuments',
  };
  logger.info({ ...loggerTech, message: 'START' });
  const documentRepository = buildDocumentRepository();
  const documents = await documentRepository.findAll();

  let documentCount = 0;
  for (const document of documents) {
    const assignations = await assignationService.fetchAssignationsOfDocumentId(document._id);
    const usersByAssignationId = await userService.fetchUsersByAssignations(assignations);
    const userNames = assignations
      ? assignations.map((assignation) => usersByAssignationId[assignation._id.toHexString()].name)
      : [];
    if (userNames.length > 1) {
      documentCount++;
      logger.info({
        ...loggerTech,
        message: `${document.documentNumber} (${document.source}) has ${
          userNames.length
        } assignated: [${userNames.join(', ')}]`,
      });
    }
  }
  logger.info({
    ...loggerTech,
    message: `${documentCount} documents found`,
  });
  logger.info({
    ...loggerTech,
    message: 'DONE',
  });
}
