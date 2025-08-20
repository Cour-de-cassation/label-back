import { documentType } from '@src/core';
import { assignationService } from '../../../assignation';
import { treatmentService } from '../../../treatment';

export { resetDocument };

async function resetDocument(documentId: documentType['_id']) {
  await assignationService.deleteAssignationsByDocumentId(documentId);
  await treatmentService.deleteTreatmentsByDocumentId(documentId);
}
