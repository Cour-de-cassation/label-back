import { assignationType, documentType } from '@src/core';
import { documentService } from '../../document';
import { buildAssignationRepository } from '../repository';

export { updateAssignationDocumentStatus };

async function updateAssignationDocumentStatus(assignationId: assignationType['_id'], status: documentType['status']) {
  const assignationRepository = buildAssignationRepository();
  const assignation = await assignationRepository.findById(assignationId);

  return documentService.updateDocumentStatus(assignation.documentId, status);
}
