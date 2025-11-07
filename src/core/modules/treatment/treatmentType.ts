import { annotationsDiffType } from '../annotationsDiff';
import { ObjectId } from 'mongodb';

type treatmentSourceType =
  | 'annotator'
  | 'admin'
  | 'NLP'
  | 'postProcess'
  | 'supplementaryAnnotations'
  | 'reimportedTreatment';

export type treatmentType = {
  _id: ObjectId;
  annotationsDiff: annotationsDiffType;
  documentId: ObjectId;
  duration: number;
  lastUpdateDate: number;
  order: number;
  surAnnotationsCount: number;
  subAnnotationsSensitiveCount: number;
  subAnnotationsNonSensitiveCount: number;
  source: treatmentSourceType;
};
