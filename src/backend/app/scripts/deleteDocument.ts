import yargs from 'yargs';
import { withMongo } from './withMongo';
import { loadSettingsFromPath } from './loadSettings';
import { logger } from '../../utils';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { documentType, settingsType } from '@src/core';
import { statisticService } from '../../modules/statistic';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { deleteDocument };

if (require.main === module) {
  (async () => {
    const { documentNumber, source, settings: settingsFile } = parseArgv();
    const settings = await loadSettingsFromPath(settingsFile);
    await withMongo(() => deleteDocument(documentNumber, source, settings));
  })();
}

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

function parseArgv() {
  const argv = yargs
    .options({
      documentNumber: {
        demandOption: true,
        description: 'number of the document you want to delete',
        type: 'number',
      },
      source: {
        demandOption: true,
        description: 'source (jurinet or jurica) of the document you want to delete',
        type: 'string',
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

  return {
    documentNumber: argv.documentNumber as number,
    source: argv.source as string,
    settings: argv.settings as string,
  };
}
