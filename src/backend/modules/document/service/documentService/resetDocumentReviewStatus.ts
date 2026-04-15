import { documentType } from '@src/core';
import { buildDocumentRepository } from '../../repository';

export { resetDocumentReviewStatus };

async function resetDocumentReviewStatus(_id: documentType['_id']) {
  const documentRepository = buildDocumentRepository();

  const updatedDocument = await documentRepository.updateOne(_id, {
    reviewStatus: { viewerNames: [], hasBeenAmended: false },
  });

  if (!updatedDocument) {
    throw new Error(`The document ${_id.toHexString()} was not found in the document collection`);
  }

  return updatedDocument;
}
