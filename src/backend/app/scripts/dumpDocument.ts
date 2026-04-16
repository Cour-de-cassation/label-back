import { logger } from '../../utils';
import { buildDocumentRepository } from '../../modules/document';
import { documentType } from '@src/core';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { dumpDocument };

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
