import { documentGenerator, decisionMetadataGenerator, checklistGenerator } from './generator';
import {
  documentType,
  fetchedDocumentType,
  documentRouteType,
  documentImporterType,
  documentStatusType,
  checklistItemType,
  checklistEntityType,
  decisionMetadataType,
  nlpVersionType,
  nlpVersionsType,
  reviewStatusType,
} from './documentType';
import {
  buildDocument,
  comparator,
  computeCaseNumber,
  countWords,
  getNextStatus,
  getMinutesBeforeFreeingPendingDocuments,
  publicationHandler,
} from './lib';

export { documentModule };

export type {
  documentType,
  fetchedDocumentType,
  documentRouteType,
  documentImporterType,
  documentStatusType,
  checklistItemType,
  checklistEntityType,
  decisionMetadataType,
  nlpVersionType,
  nlpVersionsType,
  reviewStatusType,
};

const documentModule = {
  generator: documentGenerator,
  decisionMetadataGenerator: decisionMetadataGenerator,
  checklistGenerator: checklistGenerator,
  lib: {
    buildDocument,
    comparator,
    computeCaseNumber,
    countWords,
    getNextStatus,
    getMinutesBeforeFreeingPendingDocuments,
    publicationHandler,
  },
};
