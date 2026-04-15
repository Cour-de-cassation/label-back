import { settingsType } from '../../settings';
import { treatmentGenerator } from '../generator';
import { treatmentType } from '../treatmentType';
import { computeTreatmentInfo } from './computeTreatmentInfo';
import { ObjectId } from 'mongodb';

export { build };

function build(
  treatmentFields: Omit<
    Omit<treatmentType, '_id'>,
    | 'duration'
    | 'lastUpdateDate'
    | 'subAnnotationsSensitiveCount'
    | 'subAnnotationsNonSensitiveCount'
    | 'surAnnotationsCount'
  >,
  settings: settingsType,
): treatmentType {
  const treatment = treatmentGenerator.generate(treatmentFields);
  const { subAnnotationsSensitiveCount, surAnnotationsCount, subAnnotationsNonSensitiveCount } = computeTreatmentInfo(
    treatmentFields.annotationsDiff,
    settings,
  );

  return {
    ...treatment,
    _id: new ObjectId(),
    subAnnotationsNonSensitiveCount,
    surAnnotationsCount,
    subAnnotationsSensitiveCount,
    duration: 0,
    lastUpdateDate: new Date().getTime(),
  };
}
