import { logger } from '../../utils';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { documentType, settingsType } from '@src/core';
import { statisticService } from '../../modules/statistic';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { deleteDocument };

async function deleteDocument(
  documentNumber: documentType['documentNumber'],
  source: documentType['source'],
  settings: settingsType,
) {
  const loggerTech: TechLog = {
    operations: ['other', 'deleteDocument'],
    path: './src/backend/app/scripts/deleteDocument.ts',
    message: 'deleteDocument',
  };
  logger.info({ ...loggerTech, message: 'START' });
  const documentRepository = buildDocumentRepository();
  const document = await documentRepository.findOneByDocumentNumberAndSource({
    documentNumber,
    source,
  });

  if (document) {
    await statisticService.saveStatisticsOfDocument(document, settings, 'deleted with script');
    await documentService.deleteDocument(document._id);
  } else {
    logger.info({
      ...loggerTech,
      message: `Document ${source}:${documentNumber} not found`,
    });
  }
  logger.info({
    ...loggerTech,
    message: 'DONE',
  });
}
