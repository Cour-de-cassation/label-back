import { Category } from 'dbsder-api-types';
import { ObjectId } from 'mongodb';

export type documentRouteType = 'automatic' | 'exhaustive' | 'simple' | 'confirmation' | 'request' | 'default';
export type documentImporterType = 'recent' | 'manual' | 'default';
export type documentStatusType =
  | 'loaded'
  | 'done'
  | 'free'
  | 'pending'
  | 'locked'
  | 'saved'
  | 'toBePublished'
  | 'toBeConfirmed';

export type checklistEntityType = {
  entityId: string;
  text: string;
  start: number;
  end?: number;
  category: string;
  score?: number | null;
  certaintyScore?: number | null;
  source?: string | null;
};

export type checklistItemType = {
  check_type: string;
  message: string;
  short_message: string;
  entities: checklistEntityType[];
  sentences: Array<{
    start: number;
    end: number;
  }>;
  metadata_text: string[];
  _rank?: number | null;
};

export type decisionMetadataType = {
  appealNumber: string;
  additionalTermsToAnnotate: string;
  computedAdditionalTerms?: {
    additionalTermsToAnnotate: string[];
    additionalTermsToUnAnnotate: string[];
  };
  categoriesToOmit: string[];
  chamberName: string;
  civilCaseCode: string;
  civilMatterCode: string;
  criminalCaseCode: string;
  date?: number;
  jurisdiction: string;
  occultationBlock?: number;
  NACCode: string;
  endCaseCode: string;
  session: string;
  solution: string;
  motivationOccultation?: boolean;
  raisonInteretParticulier?: string;
  sommaire?: string;
};

export type reviewStatusType = {
  viewerNames: string[];
  hasBeenAmended: boolean;
};

export type documentType = {
  _id: ObjectId;
  creationDate?: number;
  decisionMetadata: decisionMetadataType;
  documentNumber: number | string;
  importer: documentImporterType;
  publicationCategory: string[];
  reviewStatus: reviewStatusType;
  route: documentRouteType;
  source: string;
  status: documentStatusType;
  title: string;
  text: string;
  checklist: checklistItemType[] | undefined;
  externalId: string;
  priority: number;
  updateDate: number;
};
