import { documentType, idModule } from '@src/core';
import { buildDocumentRepository } from '../../repository';

export { updateDocumentComputedAdditionalTerms };

async function updateDocumentComputedAdditionalTerms(
  _id: documentType['_id'],
  computedAdditionalTerms: documentType['decisionMetadata']['computedAdditionalTerms'],
) {
  const documentRepository = buildDocumentRepository();

  const updatedDocument = await documentRepository.updateComputedAdditionalTerms(
    _id,
    computedAdditionalTerms,
  );
  if (!updatedDocument) {
    throw new Error(
      `The document ${idModule.lib.convertToString(
        _id,
      )} was not found in the document collection`,
    );
  }
  return updatedDocument;
}
