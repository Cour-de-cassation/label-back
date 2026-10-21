import { uniq } from 'lodash';
import { buildAnonymizer, dateBuilder, documentModule, documentType, indexer, settingsModule } from '@src/core';
import { buildCallAttemptsRegulator } from '../../../utils/callAttemptsRegulator/callAttemptsRegulator';
import { logger } from '../../../utils';
import { settingsLoader } from '../../../lib/settingsLoader';
import {
  countDocuments,
  deleteDocumentById,
  findDistinctDocumentValues,
  findDocument,
  findDocumentById,
  findDocuments,
  findDocumentsProjection,
  updateDocumentById,
} from '../../../connectors/db/documents';
import { assignationService } from '../../assignation';
import { problemReportService } from '../../problemReport';
import { treatmentService } from '../../treatment';
import { buildFetchDocumentsForUser } from './fetchDocumentsForUser';
import { fetchToBeConfirmedDocuments } from './fetchToBeConfirmedDocuments';
import { fetchTreatedDocuments } from './fetchTreatedDocuments';
import { fetchUntreatedDocuments } from './fetchUntreatedDocuments';

export { documentService };

const DELAY_BETWEEN_FETCH_DOCUMENT_ATTEMPTS_IN_SECONDS = 60 * 60 * 1000;

const MAX_FETCH_DOCUMENT_ATTEMPTS = 300;

const { checkCallAttempts } = buildCallAttemptsRegulator(
  MAX_FETCH_DOCUMENT_ATTEMPTS,
  DELAY_BETWEEN_FETCH_DOCUMENT_ATTEMPTS_IN_SECONDS,
);

const documentService = {
  assertDocumentIsPublishable,
  assertDocumentStatus,
  countDoneDocuments: () => countDocumentsByStatus('done'),
  countFreeDocuments: () => countDocumentsByStatus('free'),
  countLockedDocuments: () => countDocumentsByStatus('locked'),
  countPendingDocuments: () => countDocumentsByStatus('pending'),
  countSavedDocuments: () => countDocumentsByStatus('saved'),
  countToBeConfirmedDocuments: () => countDocumentsByStatus('toBeConfirmed'),
  deleteDocument,
  fetchAllDocumentsByIds,
  fetchAllExportableDocuments: () => findDocuments({ status: 'done' }),
  fetchAllImporters: () => findDistinctDocumentValues<documentType['importer']>('importer'),
  fetchAllJurisdictions,
  fetchAllPublicationCategories,
  fetchAllRoutes: () => findDistinctDocumentValues<documentType['route']>('route'),
  fetchAllSources: () => findDistinctDocumentValues<documentType['source']>('source'),
  fetchAnonymizedDocumentText,
  fetchDocument: findDocumentById,
  fetchDocumentBySourceAndDocumentNumber,
  fetchDocumentsForUser: buildFetchDocumentsForUser(checkCallAttempts),
  fetchDocumentsReadyToExport,
  fetchFreeDocumentsIds,
  fetchPublishableDocuments,
  fetchPublishableDocumentsToExport,
  fetchToBeConfirmedDocuments,
  fetchTreatedDocuments,
  fetchUntreatedDocuments,
  resetDocument,
  resetDocumentReviewStatus,
  updateDocumentReviewStatus,
  updateDocumentRoute,
  updateDocumentStatus,
};

function assertDocumentWasFound(document: documentType | undefined, _id: documentType['_id']) {
  if (!document) {
    throw new Error(`The document ${_id.toHexString()} was not found in the document collection`);
  }
  return document;
}

async function assertDocumentIsPublishable(documentId: documentType['_id']) {
  const document = await findDocumentById(documentId);
  const publishedPublicationCategoryLetters = documentModule.lib.publicationHandler.getPublishedPublicationCategory();

  if (document.status !== 'done') {
    throw new Error(`The document is not publishable, because its current status is "${document.status}"`);
  }
  if (
    !publishedPublicationCategoryLetters.some((publicationCategoryLetter) =>
      document.publicationCategory.includes(publicationCategoryLetter),
    )
  ) {
    throw new Error(
      `The document is not publishable, because its publication category is "${document.publicationCategory.join(
        ', ',
      )}"`,
    );
  }
  return true;
}

async function assertDocumentStatus({
  documentId,
  status,
}: {
  documentId: documentType['_id'];
  status: documentType['status'];
}) {
  const document = await findDocumentById(documentId);
  if (document.status !== status) {
    throw new Error(`The document status "${document.status}" does not match the following: "${status}"`);
  }
  return true;
}

async function countDocumentsByStatus(status: documentType['status']) {
  return countDocuments({ status });
}

async function deleteDocument(id: documentType['_id']) {
  await assignationService.deleteAssignationsByDocumentId(id);
  await treatmentService.deleteTreatmentsByDocumentId(id);
  await problemReportService.deleteProblemReportsByDocumentId(id);
  await deleteDocumentById(id);
}

async function fetchAllDocumentsByIds(documentIds: documentType['_id'][]) {
  const documents = await findDocuments({ _id: { $in: documentIds } });
  const documentsByIds = indexer.indexBy(documents, ({ _id }) => _id.toHexString());
  indexer.assertEveryIdIsDefined(
    documentIds.map((documentId) => documentId.toHexString()),
    documentsByIds,
    (_id) => `The document id ${_id} has no matching document`,
  );
  return documentsByIds;
}

async function fetchAllJurisdictions() {
  const jurisdictions = await findDistinctDocumentValues<documentType['decisionMetadata']['jurisdiction']>(
    'decisionMetadata.jurisdiction',
  );
  return jurisdictions.filter(Boolean);
}

async function fetchAllPublicationCategories() {
  return uniq(await findDistinctDocumentValues<string>('publicationCategory'));
}

async function fetchAnonymizedDocumentText(documentId: documentType['_id']) {
  const document = await findDocumentById(documentId);
  const annotations = await treatmentService.fetchAnnotationsOfDocument(documentId);
  const settings = settingsLoader.getSettings();
  const settingsForDocument = settingsModule.lib.computeFilteredSettings(
    settings,
    document.decisionMetadata.categoriesToOmit,
    document.decisionMetadata.additionalTermsToAnnotate,
    document.decisionMetadata.motivationOccultation,
  );
  const seed = Number(document.documentNumber) || 0;
  const anonymizer = buildAnonymizer(settingsForDocument, annotations, seed);
  return anonymizer.anonymizeDocument(document).text;
}

async function fetchDocumentBySourceAndDocumentNumber({
  source,
  documentNumber,
}: {
  source: documentType['source'];
  documentNumber: documentType['documentNumber'];
}) {
  return findDocument({ source, documentNumber });
}

async function fetchDocumentsReadyToExport(days: number) {
  return findDocuments({ status: 'done', updateDate: { $lt: dateBuilder.daysAgo(days) } });
}

async function fetchFreeDocumentsIds() {
  const documents = await findDocumentsProjection({ status: 'free' }, ['_id']);
  return documents.map(({ _id }) => _id);
}

function buildPublicationCategoryLettersFilter(publicationCategoryLetters: string[]) {
  return publicationCategoryLetters.map((publicationCategoryLetter) => ({
    publicationCategory: { $in: [publicationCategoryLetter] },
  }));
}

async function fetchPublishableDocuments() {
  const allDocuments = await findDocumentsProjection(
    {
      $or: [
        { route: { $in: ['confirmation'] } },
        ...buildPublicationCategoryLettersFilter(
          documentModule.lib.publicationHandler.getPublishedPublicationCategory(),
        ),
      ],
    },
    ['_id', 'creationDate', 'decisionMetadata', 'documentNumber', 'publicationCategory', 'route', 'status'],
  );

  return allDocuments.map(
    ({ _id, creationDate, decisionMetadata, documentNumber, publicationCategory, route, status }) => ({
      _id,
      appealNumber: decisionMetadata.appealNumber,
      chamberName: decisionMetadata.chamberName,
      jurisdiction: decisionMetadata.jurisdiction,
      creationDate,
      documentNumber,
      publicationCategory,
      route,
      status,
    }),
  );
}

async function fetchPublishableDocumentsToExport() {
  const lettersDocuments = await findDocuments({
    status: 'done',
    $or: buildPublicationCategoryLettersFilter(documentModule.lib.publicationHandler.getPublishedPublicationCategory()),
  });
  const codesDocuments = await findDocuments({
    status: 'done',
    $or: documentModule.lib.publicationHandler.getPrioritizedNACCodes().map((NACCode) => ({
      'decisionMetadata.NACCode': { $in: [NACCode] },
    })),
  });
  const interetParticulierDocuments = await findDocuments({
    status: 'done',
    'decisionMetadata.raisonInteretParticulier': { $ne: null },
  });

  const allDocuments = [...lettersDocuments, ...codesDocuments, ...interetParticulierDocuments];
  const seenIds = new Set<string>();
  return allDocuments.filter((doc) => {
    const idString = doc._id.toString();
    if (seenIds.has(idString)) return false;
    seenIds.add(idString);
    return true;
  });
}

async function resetDocument(documentId: documentType['_id']) {
  await assignationService.deleteAssignationsByDocumentId(documentId);
  await treatmentService.deleteTreatmentsByDocumentId(documentId);
}

async function resetDocumentReviewStatus(_id: documentType['_id']) {
  const updatedDocument = await updateDocumentById(_id, {
    reviewStatus: { viewerNames: [], hasBeenAmended: false },
  });
  return assertDocumentWasFound(updatedDocument, _id);
}

async function updateDocumentReviewStatus(
  _id: documentType['_id'],
  update: { hasBeenAmended?: boolean; viewerNameToAdd?: string },
) {
  const document = await findDocumentById(_id);
  const viewerNames =
    !!update.viewerNameToAdd && !document.reviewStatus.viewerNames.includes(update.viewerNameToAdd)
      ? [...document.reviewStatus.viewerNames, update.viewerNameToAdd]
      : document.reviewStatus.viewerNames;
  const hasBeenAmended =
    update.hasBeenAmended !== undefined ? update.hasBeenAmended : document.reviewStatus.hasBeenAmended;

  const updatedDocument = await updateDocumentById(_id, { reviewStatus: { viewerNames, hasBeenAmended } });
  return assertDocumentWasFound(updatedDocument, _id);
}

async function updateDocumentRoute(_id: documentType['_id'], route: documentType['route']) {
  const updatedDocument = await updateDocumentById(_id, { route });
  return assertDocumentWasFound(updatedDocument, _id);
}

async function updateDocumentStatus(_id: documentType['_id'], status: documentType['status']) {
  const updatedDocument = assertDocumentWasFound(
    await updateDocumentById(_id, { status, updateDate: new Date().getTime() }),
    _id,
  );

  if (status === 'free') {
    await assignationService.deleteAssignationsByDocumentId(_id);
  }

  logger.info({
    operations: ['other', 'updateDocumentStatus'],
    path: 'src/backend/modules/document/service/documentService.ts',
    message: `Document ${updatedDocument.source}:${updatedDocument.documentNumber} status updated to ${status}`,
    decision: {
      sourceId: updatedDocument.documentNumber.toString(),
      sourceName: updatedDocument.source,
      labelStatus: updatedDocument.status,
    },
  });

  return updatedDocument;
}
