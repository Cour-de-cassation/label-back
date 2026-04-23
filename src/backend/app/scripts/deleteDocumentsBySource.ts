import { settingsType } from '@src/core';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { statisticService } from '../../modules/statistic';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { deleteDocumentsBySource };

const BATCH_SIZE = 500;

async function deleteDocumentsBySource(source: string, settings: settingsType) {
  const loggerTech: TechLog = {
    operations: ['other', 'deleteDocumentsBySource'],
    path: './src/backend/app/scripts/deleteDocumentsBySource.ts',
    message: 'deleteDocumentsBySource',
  };

  if (!source) {
    logger.error({ ...loggerTech, message: 'Missing source argument' });
    return;
  }

  logger.info({ ...loggerTech, message: `START source=${source}` });

  const documentRepository = buildDocumentRepository();
  let totalDeleted = 0;

  await deleteNextBatch();

  async function deleteNextBatch(): Promise<void> {
    const documents = await documentRepository.findAllBySource({ source, limit: BATCH_SIZE });
    if (documents.length === 0) return;

    await documents.reduce(async (previous, document) => {
      await previous;
      await statisticService.saveStatisticsOfDocument(document, settings, 'deleted with script');
      await documentService.deleteDocument(document._id);
      totalDeleted += 1;
    }, Promise.resolve());

    logger.info({
      ...loggerTech,
      message: `Progress: deleted ${totalDeleted} (batch size ${documents.length})`,
    });

    await deleteNextBatch();
  }

  logger.info({
    ...loggerTech,
    message: `DONE source=${source}, totalDeleted=${totalDeleted}`,
  });
}
