import { documentModule } from '@src/core';
import { buildDocumentRepository } from '../../repository';

export { fetchPublishableDocumentsToExport };

async function fetchPublishableDocumentsToExport() {
  const documentRepository = buildDocumentRepository();
  const lettersDocuments = await documentRepository.findAllByPublicationCategoryLettersAndStatus(
    documentModule.lib.publicationHandler.getPublishedPublicationCategory(),
    ['toBePublished', 'done'],
  );
  const codesDocuments = await documentRepository.findAllByNACCodesAndStatus(
    documentModule.lib.publicationHandler.getPrioritizedNACCodes(),
    ['toBePublished', 'done'],
  );

  const interetParticulierDocuments = await documentRepository.findAllByParticularInterestAndStatus([
    'toBePublished',
    'done',
  ]);

  const allDocuments = [...lettersDocuments, ...codesDocuments, ...interetParticulierDocuments];
  const seenIds = new Set<string>();
  return allDocuments.filter((doc) => {
    const idString = doc._id.toString();
    if (seenIds.has(idString)) return false;
    seenIds.add(idString);
    return true;
  });
}
