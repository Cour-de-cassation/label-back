import { documentType } from '@src/core';
import { buildTreatmentRepository } from '../repository';

export { countTreatmentsByDocumentId };

async function countTreatmentsByDocumentId({ documentId }: { documentId: documentType['_id'] }): Promise<number> {
  const treatmentRepository = buildTreatmentRepository();

  return treatmentRepository.countByDocumentId(documentId);
}
