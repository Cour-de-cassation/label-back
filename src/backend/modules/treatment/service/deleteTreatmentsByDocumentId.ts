import { treatmentType } from '@src/core';
import { buildTreatmentRepository } from '../repository';

export { deleteTreatmentsByDocumentId };

async function deleteTreatmentsByDocumentId(
  documentId: treatmentType['documentId'],
) {
  const treatmentRepository = buildTreatmentRepository();
  await treatmentRepository.deleteByDocumentId(documentId);
}
