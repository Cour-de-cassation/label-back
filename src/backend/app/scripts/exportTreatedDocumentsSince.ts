import yargs from 'yargs';
import { withMongo } from './withMongo';
import { loadSettingsFromPath } from './loadSettings';
import { settingsType } from '@src/core';
import { documentService } from '../../modules/document';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';
import { exportDocument } from './exportDocument';

export { exportTreatedDocumentsSince };

if (require.main === module) {
  (async () => {
    const { days, settings: settingsFile } = parseArgv();
    const settings = await loadSettingsFromPath(settingsFile);
    await withMongo(() => exportTreatedDocumentsSince(days, settings));
  })();
}

function parseArgv() {
  const argv = yargs
    .options({
      days: {
        demandOption: true,
        description: 'treated since days',
        type: 'number',
      },
      settings: {
        alias: 's',
        demandOption: true,
        description: 'Path to settings.json',
        type: 'string',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return { days: argv.days as number, settings: argv.settings as string };
}

async function exportTreatedDocumentsSince(days: number, settings: settingsType) {
  const loggerTech: TechLog = {
    operations: ['other', 'exportTreatedDocumentsSince'],
    path: 'src/backend/app/scripts/exportTreatedDocumentsSince.ts',
    message: 'START: Exportation to SDER',
  };
  logger.info(loggerTech);

  logger.info({ ...loggerTech, message: 'Fetching treated documents...' });
  const documentsReadyToExport = await documentService.fetchDocumentsReadyToExport(days);
  logger.info({ ...loggerTech, message: `${documentsReadyToExport.length} documents to export` });

  logger.info({ ...loggerTech, message: 'Beginning exportation...' });
  for (let index = 0; index < documentsReadyToExport.length; index++) {
    logger.info({ ...loggerTech, message: `Exportation of document ${index + 1}/${documentsReadyToExport.length}` });
    await exportDocument(documentsReadyToExport[index], settings);
  }

  logger.info({ ...loggerTech, message: 'DONE' });
}
