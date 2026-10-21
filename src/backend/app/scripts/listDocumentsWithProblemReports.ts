import { withMongo } from './withMongo';
import { timeOperator } from '@src/core';
import { findProblemReports } from '../../connectors/db/problemReports';
import { logger } from '../../utils';
import { findDocumentById } from '../../connectors/db/documents';

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

  const problemReports = await findProblemReports();
  logger.info({
    operations: ['other', 'listDocumentsWithProblemReports'],
    path: 'src/backend/app/scripts/listDocumentsWithProblemReports.ts',
    message: `${problemReports.length} problemReports found`,
  });
  for (let index = 0; index < problemReports.length; index++) {
    const problemReport = problemReports[index];
    const document = await findDocumentById(problemReport['documentId']);

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
