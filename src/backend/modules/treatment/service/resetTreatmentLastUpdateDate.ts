import { treatmentType } from '@src/core';
import { buildTreatmentRepository } from '../repository';

export { resetTreatmentLastUpdateDate };

async function resetTreatmentLastUpdateDate(treatmentId: treatmentType['_id']) {
  const treatmentRepository = buildTreatmentRepository();

  const now = new Date();

  await treatmentRepository.updateOne(treatmentId, {
    lastUpdateDate: now.getTime(),
  });
}
