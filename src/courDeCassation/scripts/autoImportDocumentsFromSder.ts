import { buildBackend } from '@src/backend';
import { sderConnector } from '../connector';
import { parametersHandler } from '../lib/parametersHandler';
import { settingsType } from '@src/core';
(async () => {
  const { settings } = await parametersHandler.getParameters();
  const backend = buildBackend(settings);

  backend.runScript(() => autoImportDocumentsFromSder(settings), {
    shouldLoadDb: true,
  });
})();

async function autoImportDocumentsFromSder(settings: settingsType) {
  await sderConnector.importNewDocuments(settings);
}
