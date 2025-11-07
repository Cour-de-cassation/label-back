import { checklistItemType, documentImporterType, documentRouteType } from '../document';
import { idType } from '../id';

export type statisticType = {
  _id: idType;
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
    userId: idType;
    treatmentDuration: number;
  }>;
  wordsCount: number;
  checklist: checklistItemType[];
  comment?: string;
};
