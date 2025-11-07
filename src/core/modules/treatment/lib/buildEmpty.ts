import { treatmentGenerator } from '../generator';
import { treatmentType } from '../treatmentType';
import { ObjectId } from 'mongodb';

export { buildEmpty };

function buildEmpty(
  treatmentFields: Omit<
    Omit<treatmentType, '_id'>,
    | 'duration'
    | 'lastUpdateDate'
    | 'subAnnotationsSensitiveCount'
    | 'subAnnotationsNonSensitiveCount'
    | 'surAnnotationsCount'
  >,
): treatmentType {
  const treatment = treatmentGenerator.generate(treatmentFields);

  return {
    ...treatment,
    _id: new ObjectId(),
    subAnnotationsSensitiveCount: 0,
    surAnnotationsCount: 0,
    subAnnotationsNonSensitiveCount: 0,
    duration: 0,
    lastUpdateDate: new Date().getTime(),
  };
}
