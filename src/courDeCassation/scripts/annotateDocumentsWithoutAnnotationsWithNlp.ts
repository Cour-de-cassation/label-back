import { buildBackend } from '@src/backend';
import { settingsType } from '@src/core';
import { buildNlpAnnotator } from '../annotator';
import { parametersHandler } from '../lib/parametersHandler';
import * as dotenv from 'dotenv';
(async () => {
  if (process.env.RUN_MODE === 'LOCAL') {
    dotenv.config();
  }
  const { settings } = await parametersHandler.getParameters();
  const backend = buildBackend(settings);
  backend.runScript(() => annotateDocumentsWithoutAnnotationsWithNlp(settings), {
    shouldLoadDb: true,
  });
})();

async function annotateDocumentsWithoutAnnotationsWithNlp(settings: settingsType) {
  const nlpAnnotator = buildNlpAnnotator(settings);

  await nlpAnnotator.annotateDocumentsWithoutAnnotations();
}
