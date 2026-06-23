import { withMongo } from './withMongo';
import { loadSettings } from './loadSettings';
import { settingsType } from '@src/core';
import { documentService } from '../../modules/document';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';
import { exportDocument } from './exportDocument';

export { exportAllTreatedDocuments };

if (require.main === module) {
  (async () => {
    const settings = await loadSettings();
    await withMongo(() => exportAllTreatedDocuments(settings));
  })();
}

async function exportAllTreatedDocuments(settings: settingsType) {
  const loggerTech: TechLog = {
    operations: ['other', 'exportAllTreatedDocuments'],
    path: 'src/backend/app/scripts/exportAllTreatedDocuments.ts',
    message: 'START: Exportation to SDER',
  };
  logger.info(loggerTech);

  logger.info({ ...loggerTech, message: 'Fetching all treated documents...' });
  const documentsToExport = await documentService.fetchAllExportableDocuments();
  logger.info({ ...loggerTech, message: `${documentsToExport.length} documents to export` });

  logger.info({ ...loggerTech, message: 'Beginning exportation...' });
  for (let index = 0; index < documentsToExport.length; index++) {
    logger.info({ ...loggerTech, message: `Exportation of document ${index + 1}/${documentsToExport.length}` });
    await exportDocument(documentsToExport[index], settings);
  }

  logger.info({ ...loggerTech, message: 'DONE' });
}
