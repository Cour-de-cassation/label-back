import { documentType, indexer } from '@src/core';
import { buildDocumentRepository } from '../../repository';

export { fetchAllDocumentsByIds };

async function fetchAllDocumentsByIds(documentIds: documentType['_id'][]) {
  const documentRepository = buildDocumentRepository();
  const documentsByIds = await documentRepository.findAllByIds(documentIds);

  indexer.assertEveryIdIsDefined(
    documentIds.map((documentId) => documentId.toHexString()),
    documentsByIds,
    (_id) => `The document id ${_id} has no matching document`,
  );

  return documentsByIds;
}
