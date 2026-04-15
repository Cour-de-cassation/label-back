import { documentType } from '@src/core';
import { logger } from '../../utils';
import { preAssignationService } from '../../modules/preAssignation';
import { assignationService } from '../../modules/assignation';
import { documentService } from '../../modules/document';
import { ObjectId } from 'mongodb';

export { buildPreAssignator };

function buildPreAssignator() {
  return {
    preAssignDocument,
  };

  async function preAssignDocument(document: documentType): Promise<boolean> {
    logger.log({
      operationName: 'preAssignation',
      msg: `Starting preAssignation for document ${document.source} ${document.documentNumber}`,
    });

    if (document.status === 'loaded') {
      const preAssignationForDocument =
        (await preAssignationService.fetchPreAssignationBySourceAndNumber(
          document.documentNumber.toString(),
          document.source,
        )) ||
        (await preAssignationService.fetchPreAssignationBySourceAndNumber(
          document.decisionMetadata.appealNumber,
          document.source,
        ));

      if (preAssignationForDocument != undefined) {
        logger.log({
          operationName: 'preAssignation',
          msg: `Pre-assignation found for document ${document.source} ${document.documentNumber}. Matching pre-assignation number : ${preAssignationForDocument.number}. Creating assignation...`,
        });
        await assignationService.createAssignation({
          documentId: new ObjectId(document._id),
          userId: new ObjectId(preAssignationForDocument.userId),
        });
        await preAssignationService.deletePreAssignation(preAssignationForDocument._id);
        if (document.route === 'automatic' || document.route === 'simple') {
          await documentService.updateDocumentRoute(new ObjectId(document._id), 'exhaustive');
        }
        await documentService.updateDocumentStatus(new ObjectId(document._id), 'saved');

        logger.log({
          operationName: 'preAssignation',
          msg: `Pre-assignation DONE`,
        });

        return true;
      } else {
        logger.log({
          operationName: 'preAssignation',
          msg: `Pre-assignation not found for document ${document.source} ${document.documentNumber}`,
        });
        return false;
      }
    } else {
      logger.error({
        operationName: 'preAssignation',
        msg: `Document status must be loaded before pre-assign it`,
      });
      throw new Error('Document status must be loaded before pre-assign it');
    }
  }
}
