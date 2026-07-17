import { logger } from '../../utils';
import { documentType } from '@src/core';
import { extractRouteForJurinet } from './extractRouteForJurinet';
import { extractRouteForCivilJurisdiction } from './extractRouteForCivilJurisdiction';

export { extractRoute };

async function extractRoute(document: documentType): Promise<documentType['route']> {
  let route: documentType['route'] = 'default';

  const extractRouteFunctions = {
    ['jurinet']: extractRouteForJurinet,
    ['jurica']: extractRouteForCivilJurisdiction,
    ['juricav2']: extractRouteForCivilJurisdiction,
    ['juritj']: extractRouteForCivilJurisdiction,
    ['juritcom']: extractRouteForCivilJurisdiction,
    ['portalis-cph']: extractRouteForCivilJurisdiction,
  };

  try {
    if (document.source in extractRouteFunctions) {
      route = await extractRouteFunctions[document.source as keyof typeof extractRouteFunctions](document);
    } else {
      throw new Error('Source non prise en charge');
    }
  } catch (e) {
    logger.error({
      operations: ['other', `extractRouteFor ${document.source}`],
      path: `src/backend/lib/extractRoute/extractRoute.ts`,
      message: `Error extracting route for ${JSON.stringify({
        decision: {
          sourceId: document.documentNumber,
          sourceName: document.source,
        },
      })}`,
      stack: e instanceof Error ? e.stack : undefined,
    });
    route = 'default';
  }

  logger.info({
    operations: ['other', `extractRouteFor ${document.source}`],
    path: `src/backend/lib/extractRoute/extractRoute.ts`,
    message: `Applied route: ${route}`,
    decision: {
      sourceId: document.documentNumber.toString(),
      sourceName: document.source,
    },
  });

  return route;
}
