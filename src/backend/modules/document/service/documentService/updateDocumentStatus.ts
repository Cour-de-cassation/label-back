import { documentType, idModule } from '@src/core';
import { assignationService } from '../../../assignation';
import { buildDocumentRepository } from '../../repository';
import { logger } from '../../../../utils';

export { updateDocumentStatus };

async function updateDocumentStatus(_id: documentType['_id'], status: documentType['status']) {
  const documentRepository = buildDocumentRepository();
  const updatedDocument = await documentRepository.updateStatusById(_id, status);
  if (!updatedDocument) {
    throw new Error(`The document ${idModule.lib.convertToString(_id)} was not found in the document collection`);
  }
  if (status === 'free') {
    await assignationService.deleteAssignationsByDocumentId(_id);
  }
  logger.log({
    operationName: 'updateDocumentStatus',
    msg: `Document ${updatedDocument.source}:${updatedDocument.documentNumber} status updated to ${status}`,
    data: {
      decision: {
        sourceId: updatedDocument.documentNumber,
        sourceName: updatedDocument.source,
      },
    },
  });
  return updatedDocument;
}
