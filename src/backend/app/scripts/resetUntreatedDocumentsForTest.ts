import { withMongo } from './withMongo';
import { documentType } from '@src/core';
import { logger } from '../../utils';
import { buildDocumentRepository } from '../../modules/document';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { resetUntreatedDocumentsForTest };

if (require.main === module) {
  (async () => {
    await withMongo(resetUntreatedDocumentsForTest);
  })();
}

async function resetUntreatedDocumentsForTest() {
  const loggerTech: TechLog = {
    operations: ['other', 'resetUntreatedDocumentsForTest'],
    path: 'src/backend/app/scripts/resetUntreatedDocumentsForTest.ts',
    message: 'START',
  };
  logger.info(loggerTech);
  const documentRepository = buildDocumentRepository();

  const untreatedDocuments = await documentRepository.findAllByStatus(['free']);
  logger.info({
    ...loggerTech,
    message: `Found ${untreatedDocuments.length} untreated documents`,
  });

  const updatedUntreatedDocuments = untreatedDocuments.map((document) => ({
    ...document,
    route: getRandomRoute(),
  }));

  await Promise.all(
    updatedUntreatedDocuments.map(async (document) => {
      await documentRepository.updateOne(document._id, {
        route: document.route,
        status: document.route === 'automatic' ? 'done' : 'free',
      });
    }),
  );

  logger.info({
    ...loggerTech,
    message: 'DONE',
  });
}

function getRandomRoute(): documentType['route'] {
  const random = Math.random();

  if (random > 0.7) {
    return 'simple';
  } else if (random > 0.5) {
    return 'default';
  } else if (random > 0.4) {
    return 'confirmation';
  } else if (random > 0.1) {
    return 'exhaustive';
  } else {
    return 'automatic';
  }
}
