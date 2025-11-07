import { annotationsDiffType } from '../annotationsDiff';
import { idType } from '../id';

type treatmentSourceType =
  | 'annotator'
  | 'admin'
  | 'NLP'
  | 'postProcess'
  | 'supplementaryAnnotations'
  | 'reimportedTreatment';

export type treatmentType = {
  _id: idType;
  annotationsDiff: annotationsDiffType;
  documentId: idType;
  duration: number;
  lastUpdateDate: number;
  order: number;
  surAnnotationsCount: number;
  subAnnotationsSensitiveCount: number;
  subAnnotationsNonSensitiveCount: number;
  source: treatmentSourceType;
};
