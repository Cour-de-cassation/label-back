import { dateBuilder, documentModule } from '@src/core';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { logger } from '../../utils';
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { freePendingDocuments };

async function freePendingDocuments() {
  const loggerTech: TechLog = {
    operations: ['other', 'freePendingDocuments'],
    path: './src/backend/app/scripts/freePendingDocuments.ts',
  };
  logger.info({ ...loggerTech, message: 'START' });

  const documentRepository = buildDocumentRepository();

  logger.info({
    ...loggerTech,
    message: 'Fetching pending documents',
  });
  const pendingDocuments = await documentRepository.findAllByStatusProjection(['pending'], ['_id', 'updateDate']);
  logger.info({
    ...loggerTech,
    message: `${pendingDocuments.length} documents fetched`,
  });
  const minutesBeforeFreeing = documentModule.lib.getMinutesBeforeFreeingPendingDocuments();
  const pendingDocumentsToFree = pendingDocuments.filter(
    (document) => document.updateDate <= dateBuilder.minutesAgo(minutesBeforeFreeing),
  );
  logger.info({
    ...loggerTech,
    message: `${pendingDocumentsToFree.length} documents to free`,
  });

  for (let index = 0; index < pendingDocumentsToFree.length; index++) {
    logger.info({
      ...loggerTech,
      message: `Freeing document ${index + 1}/${pendingDocumentsToFree.length}`,
    });
    await documentService.updateDocumentStatus(pendingDocumentsToFree[index]._id, 'free');
  }

  logger.info({ ...loggerTech, message: 'DONE' });
}
