import { buildAnnotator, annotatorConfigType } from '@src/backend';
import { settingsType } from '@src/core';
import { buildNlpFetcher } from './fetcher';

export { buildNlpAnnotator };

function buildNlpAnnotator(settings: settingsType) {
  const nlpApiBaseUrl = process.env.NLP_PSEUDONYMISATION_API_URL;
  const nlpAnnotatorConfig: annotatorConfigType = {
    name: 'NLP',
    ...buildNlpFetcher(nlpApiBaseUrl),
  };

  return buildAnnotator(settings, nlpAnnotatorConfig);
}
