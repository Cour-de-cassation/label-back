import { flatten } from 'lodash';
import { assignationService } from '../../assignation';
import { userService } from '../../user';
import { findDocumentsProjection } from '../../../connectors/db/documents';

export { fetchUntreatedDocuments };

async function fetchUntreatedDocuments() {
  const untreatedDocuments = await findDocumentsProjection(
    { status: { $in: ['free', 'pending', 'saved', 'locked'] } },
    ['_id', 'creationDate', 'decisionMetadata', 'documentNumber', 'publicationCategory', 'source', 'route', 'status'],
  );
  const assignedDocumentIds = untreatedDocuments
    .filter((document) => ['pending', 'saved', 'locked'].includes(document.status))
    .map((document) => document._id);
  const assignationsByDocumentId = await assignationService.fetchAssignationsByDocumentIds(assignedDocumentIds, {
    assertEveryDocumentIsAssigned: false,
  });
  const allAssignations = flatten(Object.values(assignationsByDocumentId));
  const usersByAssignationId = await userService.fetchUsersByAssignations(allAssignations);
  return untreatedDocuments.map((untreatedDocument) => {
    const assignationsForDocument = assignationsByDocumentId[untreatedDocument._id.toHexString()];
    const userNames = assignationsForDocument
      ? assignationsForDocument.map((assignation) => usersByAssignationId[assignation._id.toHexString()].name)
      : [];

    return {
      document: {
        _id: untreatedDocument._id,
        creationDate: untreatedDocument.creationDate,
        decisionDate: untreatedDocument.decisionMetadata.date,
        documentNumber: untreatedDocument.documentNumber,
        occultationBlock: untreatedDocument.decisionMetadata.occultationBlock,
        jurisdiction: untreatedDocument.decisionMetadata.jurisdiction,
        publicationCategory: untreatedDocument.publicationCategory,
        source: untreatedDocument.source,
        route: untreatedDocument.route,
        status: untreatedDocument.status,
      },
      userNames,
    };
  });
}
