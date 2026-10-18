import yargs from 'yargs';
import { withMongo } from './withMongo';
import { loadSettingsFromPath } from './loadSettings';
import { settingsType } from '@src/core';
import { documentService } from '../../modules/document';
import { logger } from '../../utils';
import { DecisionLog } from '@src/backend/utils/logger/loggerType';
import { exportDocument } from './exportDocument';

export { exportSpecificDocument };

if (require.main === module) {
  (async () => {
    const { documentNumber, source, settings: settingsFile } = parseArgv();
    const settings = await loadSettingsFromPath(settingsFile);
    await withMongo(() => exportSpecificDocument({ documentNumber, source }, settings));
  })();
}

function parseArgv() {
  const argv = yargs
    .options({
      documentNumber: {
        demandOption: true,
        description: 'number of the document you want to export',
        type: 'string',
      },
      source: {
        demandOption: true,
        description: 'source (jurinet or jurica) of the document you want to export',
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
    documentNumber: argv.documentNumber as string,
    source: argv.source as string,
    settings: argv.settings as string,
  };
}

async function exportSpecificDocument(
  { documentNumber, source }: { documentNumber: string; source: string },
  settings: settingsType,
) {
  const loggerDecision: DecisionLog = {
    operations: ['other', 'exportSpecificDocument'],
    path: 'src/backend/app/scripts/exportSpecificDocument.ts',
    message: `Export specific document ${source}:${documentNumber}`,
    decision: {
      sourceId: documentNumber.toString(),
      sourceName: source,
    },
  };
  logger.info({
    ...loggerDecision,
    message: `START: documentNumber ${documentNumber} - source ${source}`,
  });
  const document = await documentService.fetchDocumentBySourceAndDocumentNumber({ documentNumber, source });

  if (!document) {
    logger.error({
      ...loggerDecision,
      message: `The document you specified (documentNumber ${documentNumber} - source ${source}) does not exist in the database`,
    });
    return;
  }

  if (document.status !== 'done') {
    logger.error({
      ...loggerDecision,
      message: `The document you specified has been found, but is not ready to be exported (status: ${document.status})`,
    });
    return;
  }

  logger.info({ ...loggerDecision, message: 'Document found. Exporting...' });
  await exportDocument(document, settings);
  logger.info({ ...loggerDecision, message: 'DONE' });
}
