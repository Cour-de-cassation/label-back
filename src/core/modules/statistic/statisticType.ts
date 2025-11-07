import { checklistItemType, documentImporterType, documentRouteType } from '../document';
import { ObjectId } from 'mongodb';

export type statisticType = {
  _id: ObjectId;
  annotationsCount: number;
  appealNumber?: string;
  documentNumber: number;
  decisionDate?: number;
  documentExternalId: string;
  chamberName?: string;
  importer: documentImporterType;
  jurisdiction: string;
  linkedEntitiesCount: number;
  publicationCategory: string[];
  session?: string;
  endCaseCode?: string;
  NACCode?: string;
  route: documentRouteType;
  source: string;
  surAnnotationsCount: number;
  subAnnotationsSensitiveCount: number;
  subAnnotationsNonSensitiveCount: number;
  treatmentDate: number;
  treatmentsSummary: Array<{
    userId: ObjectId;
    treatmentDuration: number;
  }>;
  wordsCount: number;
  checklist: checklistItemType[];
  comment?: string;
};
