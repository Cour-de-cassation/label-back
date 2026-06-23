import { withMongo } from './withMongo';
import { timeOperator } from '@src/core';
import { buildProblemReportRepository } from '../../modules/problemReport';
import { buildDocumentRepository } from '../../modules/document';
import { logger } from '../../utils';

export { listDocumentsWithProblemReports };

if (require.main === module) {
  (async () => {
    await withMongo(listDocumentsWithProblemReports);
  })();
}

async function listDocumentsWithProblemReports() {
  logger.info({
    operations: ['other', 'listDocumentsWithProblemReports'],
    path: 'src/backend/app/scripts/listDocumentsWithProblemReports.ts',
    message: 'START',
  });

  const problemnReportsRepository = buildProblemReportRepository();
  const documentRepository = buildDocumentRepository();

  const problemReports = await problemnReportsRepository.findAll();
  logger.info({
    operations: ['other', 'listDocumentsWithProblemReports'],
    path: 'src/backend/app/scripts/listDocumentsWithProblemReports.ts',
    message: `${problemReports.length} problemReports found`,
  });
  for (let index = 0; index < problemReports.length; index++) {
    const problemReport = problemReports[index];
    const document = await documentRepository.findById(problemReport['documentId']);

    logger.info({
      operations: ['other', 'listDocumentsWithProblemReports'],
      path: 'src/backend/app/scripts/listDocumentsWithProblemReports.ts',
      message: `${index + 1} | ${document['_id']} | ${document['source']} | ${document['documentNumber']} | ${
        document['creationDate'] && timeOperator.convertTimestampToReadableDate(document['creationDate'])
      }`,
      decision: {
        sourceId: document.documentNumber.toString(),
        sourceName: document.source,
        labelStatus: document.status,
      },
    });
  }

  logger.info({
    operations: ['other', 'listDocumentsWithProblemReports'],
    path: 'src/backend/app/scripts/listDocumentsWithProblemReports.ts',
    message: 'DONE',
  });
}
