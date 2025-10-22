import { documentService } from '../../document';

export { fetchSummary };

async function fetchSummary() {
  const freeDocumentsCount = await documentService.countFreeDocuments();
  const pendingDocumentsCount = await documentService.countPendingDocuments();
  const savedDocumentsCount = await documentService.countSavedDocuments();
  const doneDocumentsCount = await documentService.countDoneDocuments();
  const lockedDocumentsCount = await documentService.countLockedDocuments();

  return {
    freeDocuments: freeDocumentsCount,
    pendingDocuments: pendingDocumentsCount,
    savedDocuments: savedDocumentsCount,
    doneDocuments: doneDocumentsCount,
    lockedDocuments: lockedDocumentsCount,
  };
}
