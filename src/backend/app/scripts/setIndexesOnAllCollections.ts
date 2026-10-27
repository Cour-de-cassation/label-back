import { ensureDocumentsIndexes } from '../../connectors/db/documents';
import { ensureAssignationsIndexes } from '../../connectors/db/assignations';
import { ensureTreatmentsIndexes } from '../../connectors/db/treatments';
import { ensureUsersIndexes } from '../../connectors/db/users';

export { setIndexesOnAllCollections };

async function setIndexesOnAllCollections() {
  await Promise.all([
    ensureDocumentsIndexes(),
    ensureAssignationsIndexes(),
    ensureTreatmentsIndexes(),
    ensureUsersIndexes(),
  ]);
}
