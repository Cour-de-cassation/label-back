import { settingsType } from '@src/core';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { statisticService } from '../../modules/statistic';
import { logger } from '../../utils';

export { deleteDocumentsBySource };

const BATCH_SIZE = 500;

async function deleteDocumentsBySource(source: string, settings: settingsType) {
  if (!source) {
    logger.error({ operationName: 'deleteDocumentsBySource', msg: 'Missing source argument' });
    return;
  }

  logger.log({ operationName: 'deleteDocumentsBySource', msg: `START source=${source}` });

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

    logger.log({
      operationName: 'deleteDocumentsBySource',
      msg: `Progress: deleted ${totalDeleted} (batch size ${documents.length})`,
    });

    await deleteNextBatch();
  }

  logger.log({
    operationName: 'deleteDocumentsBySource',
    msg: `DONE source=${source}, totalDeleted=${totalDeleted}`,
  });
}
