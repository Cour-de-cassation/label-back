import { checklistItemType, documentImporterType, documentRouteType } from '../document';
import { ObjectId } from 'mongodb';

export type statisticType = {
  _id: ObjectId;
  annotationsCount: number;
  appealNumber?: string;
  documentNumber: number | string;
  decisionDate?: number;
  documentExternalId: string;
  chamberName?: string;
  importer: documentImporterType;
  jurisdiction: string;
  linkedEntitiesCount: number;
  publicationCategory: string[];
  session?: string;
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
  checklist: checklistItemType[] | undefined;
  comment?: string;
};
