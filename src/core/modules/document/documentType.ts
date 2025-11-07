import { idType } from '../id';

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
  text: string;
  start: number;
  category: string;
  source: string;
  score: number;
  entityId: string;
  end: number;
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
};

export type nlpVersionType = {
  version: string;
  date: string;
};

export type nlpVersionsType = {
  juriSpacyTokenizer: nlpVersionType;
  juritools: nlpVersionType;
  pseudonymisationApi: nlpVersionType;
  model: {
    name: string;
  };
};

export type decisionMetadataType = {
  appealNumber: string;
  additionalTermsToAnnotate: string;
  computedAdditionalTerms?: {
    additionalTermsToAnnotate: string[];
    additionalTermsToUnAnnotate: string[];
  };
  additionalTermsParsingFailed?: boolean;
  boundDecisionDocumentNumbers: number[];
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
  selection?: boolean;
  sommaire?: string;
};

export type reviewStatusType = {
  viewerNames: string[];
  hasBeenAmended: boolean;
};

export type fetchedDocumentType = {
  _id: idType;
  creationDate?: number;
  decisionMetadata: decisionMetadataType;
  documentNumber: number;
  importer: documentImporterType;
  loss?: number;
  nlpVersions?: nlpVersionsType;
  publicationCategory: string[];
  reviewStatus: reviewStatusType;
  route: documentRouteType;
  source: string;
  status: documentStatusType;
  title: string;
  text: string;
  checklist: checklistItemType[];
};

export type documentType = fetchedDocumentType & {
  externalId: string;
  priority: number;
  updateDate: number;
};
