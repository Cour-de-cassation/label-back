import { withMongo } from './withMongo';
import { loadSettings } from './loadSettings';
import { settingsType } from '@src/core';
import { documentService } from '../../modules/document';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';
import { exportDocument } from './exportDocument';

export { exportTreatedPublishableDocuments };

if (require.main === module) {
  (async () => {
    const settings = await loadSettings();
    await withMongo(() => exportTreatedPublishableDocuments(settings));
  })();
}

async function exportTreatedPublishableDocuments(settings: settingsType) {
  const loggerTech: TechLog = {
    operations: ['other', 'exportTreatedPublishableDocuments'],
    path: 'src/backend/app/scripts/exportTreatedPublishableDocuments.ts',
    message: 'START: Exportation to SDER',
  };
  logger.info(loggerTech);

  logger.info({ ...loggerTech, message: 'Fetching treated documents from today...' });
  const documentsReadyToExport = await documentService.fetchPublishableDocumentsToExport();
  logger.info({ ...loggerTech, message: `${documentsReadyToExport.length} documents to export` });

  logger.info({ ...loggerTech, message: 'Beginning exportation...' });
  for (let index = 0; index < documentsReadyToExport.length; index++) {
    logger.info({ ...loggerTech, message: `Exportation of document ${index + 1}/${documentsReadyToExport.length}` });
    await exportDocument(documentsReadyToExport[index], settings);
  }

  logger.info({ ...loggerTech, message: 'DONE' });
}
