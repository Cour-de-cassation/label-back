import { documentGenerator, decisionMetadataGenerator, checklistGenerator } from './generator';
import {
  documentType,
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
