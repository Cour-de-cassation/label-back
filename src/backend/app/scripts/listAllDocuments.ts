import { buildDocumentRepository } from '../../modules/document';
import { logger } from '../../utils';
import { TechLog, DecisionLog } from '@src/backend/utils/logger/loggerType';

export { listAllDocuments };

async function listAllDocuments() {
  const loggerTech: TechLog = {
    operations: ['other', 'listAllDocuments'],
    path: 'src/backend/app/scripts/listAllDocuments.ts',
    message: 'listAllDocuments',
  };

  logger.info({ ...loggerTech, message: 'START' });

  const documentRepository = buildDocumentRepository();

  const documents = await documentRepository.findAll();
  logger.info({ ...loggerTech, message: `${documents.length} documents found` });

  for (let index = 0; index < documents.length; index++) {
    const document = documents[index];
    const decisionLog: DecisionLog = {
      operations: ['other', 'listAllDocuments'],
      path: 'src/backend/app/scripts/listAllDocuments.ts',
      message: `${index + 1} | ${document['_id']} | ${document['source']} | ${
        document['documentNumber']
      } | ${document['status']} | ${document['creationDate']}`,
      decision: {
        sourceId: document.documentNumber.toString(),
        sourceName: document.source,
        labelStatus: document.status,
      },
    };
    logger.info(decisionLog);
  }

  logger.info({ ...loggerTech, message: 'DONE' });
}
