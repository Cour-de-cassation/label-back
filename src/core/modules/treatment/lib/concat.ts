import { treatmentType } from '..';
import { computeAnnotations } from './computeAnnotations';
import { documentType } from '../../document/documentType';
import { Deprecated } from '../../../types/decision';

export { concat };

function concat(treatments: treatmentType[]): Deprecated.LabelTreatment[] {
  const labelTreatments: Deprecated.LabelTreatment[] = [];

  const sortedTreatments = treatments.sort((treatment1, treatment2) => treatment1.order - treatment2.order);

  while (sortedTreatments.length > 0) {
    const order = sortedTreatments.length;
    const currentTreatment = sortedTreatments[order - 1];

    if (currentTreatment.source != 'reimportedTreatment') {
      labelTreatments.unshift({
        annotations: computeAnnotations(sortedTreatments),
        source: computeSource(currentTreatment.source),
        order,
        treatmentDate: new Date(currentTreatment.lastUpdateDate).toISOString(),
      });
    }
    sortedTreatments.pop();
  }

  // re-write order in case of skipped treatments (NLP or reimported)
  labelTreatments.forEach((labelTreatment, index) => {
    labelTreatment.order = index + 1;
  });

  return labelTreatments;

  function computeSource(source: treatmentType['source']) {
    switch (source) {
      case 'NLP':
        return 'NLP';
      case 'annotator':
      case 'admin':
        return 'LABEL_WORKING_USER_TREATMENT';
      default:
        return 'LABEL_AUTO_TREATMENT';
    }
  }
}
