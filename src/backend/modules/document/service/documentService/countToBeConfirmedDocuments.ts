import { buildDocumentRepository } from '../../repository';

export { countToBeConfirmedDocuments };

async function countToBeConfirmedDocuments() {
  const documentRepository = buildDocumentRepository();
  return documentRepository.countByStatus(['toBeConfirmed']);
}
