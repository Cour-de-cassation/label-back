import { treatmentType } from '../treatmentType';

export { computeTreatmentIdsText };

function computeTreatmentIdsText(treatments: treatmentType[]) {
  return `[${treatments.map((treatment) => treatment._id.toHexString()).join(', ')}]`;
}
