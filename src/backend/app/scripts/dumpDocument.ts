import yargs from 'yargs';
import { withMongo } from './withMongo';
import { logger } from '../../utils';
import { buildDocumentRepository } from '../../modules/document';
import { documentType } from '@src/core';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { dumpDocument };

if (require.main === module) {
  (async () => {
    const { documentNumber, source } = parseArgv();
    await withMongo(() => dumpDocument(documentNumber, source));
  })();
}

async function dumpDocument(documentNumber: documentType['documentNumber'], source: documentType['source']) {
  const loggerTech: TechLog = {
    operations: ['other', 'dumpDocument'],
    path: 'src/backend/app/scripts/dumpDocument.ts',
    message: 'dumpDocument',
  };
  logger.info({ ...loggerTech, message: 'START' });
  const documentRepository = buildDocumentRepository();
  const document = await documentRepository.findOneByDocumentNumberAndSource({
    documentNumber,
    source,
  });

  logger.info({
    ...loggerTech,
    message: 'Document:',
    decision: {
      sourceId: documentNumber.toString(),
      sourceName: source,
      labelStatus: document?.status,
    },
  });
  logger.info({ ...loggerTech, message: 'DONE' });
}

function parseArgv() {
  const argv = yargs
    .options({
      documentNumber: {
        demandOption: true,
        description: 'number of the document you want to dump',
        type: 'number',
      },
      source: {
        demandOption: true,
        description: 'source (jurinet or jurica) of the document you want to dump',
        type: 'string',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return {
    documentNumber: argv.documentNumber as number,
    source: argv.source as string,
  };
}
