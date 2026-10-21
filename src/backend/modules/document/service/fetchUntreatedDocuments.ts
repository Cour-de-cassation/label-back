import { findDocumentsWithAssignations } from '../../../connectors/db/documents';
import { getAssignedUserName } from './getAssignedUserName';

export { fetchUntreatedDocuments };

async function fetchUntreatedDocuments() {
  const untreatedDocuments = await findDocumentsWithAssignations(
    { status: { $in: ['free', 'pending', 'saved', 'locked'] } },
    ['_id', 'creationDate', 'decisionMetadata', 'documentNumber', 'publicationCategory', 'source', 'route', 'status'],
  );

  return untreatedDocuments.map(({ assignations, assignedUsers, ...untreatedDocument }) => {
    // Assignations of free documents are not relevant
    const userNames =
      untreatedDocument.status === 'free'
        ? []
        : assignations.map(({ userId }) => getAssignedUserName(assignedUsers, userId));

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
