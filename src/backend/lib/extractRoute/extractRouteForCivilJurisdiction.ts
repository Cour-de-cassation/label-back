import { documentType } from '@src/core';
import axios, { AxiosResponse, Method } from 'axios';
import { documentService } from '../../modules/document';
import { logger } from '../../utils';
import { Category, CodeNac } from 'dbsder-api-types';
import { DBSDER_API_URL, DBSDER_API_KEY } from '../../utils/env';
import { DecisionLog } from '@src/backend/utils/logger/loggerType';

export { extractRouteForCivilJurisdiction };

async function extractRouteForCivilJurisdiction({
  raisonInteretParticulier,
  NACCode,
  sourceName,
  sourceId,
  additionalTermsToAnnotate,
  checklist,
  categoriesToOmit,
  motivationOccultation,
}: {
  raisonInteretParticulier: string | null;
  NACCode: string;
  sourceName: string;
  sourceId: string | number;
  additionalTermsToAnnotate: string | undefined;
  checklist: unknown[] | undefined;
  categoriesToOmit: string[];
  motivationOccultation: boolean | undefined;
}): Promise<documentType['route']> {
  if (sourceName === 'portalis-cph') {
    const routeRelecture = 'default';
    logger.info({
      path: 'src/backend/lib/extractRoute/extractRouteForCivilJurisdiction.ts',
      operations: ['other', 'computeRouteForCph'],
      message: `Relecture ${routeRelecture} appliquée`,
    });
    return routeRelecture;
  }

  if (
    checklist &&
    checklist.length > 0 &&
    // TEMP : ne pas prendre en compte les checklist si occultation des motifs
    !motivationOccultation == true
  ) {
    return 'exhaustive';
  }

  // Relecture exhaustive pour les décisions présentant un intéret particulier
  if (raisonInteretParticulier && raisonInteretParticulier != null) {
    return 'exhaustive';
  }

  // Relecture exhaustive pour les décisions comportant des demandes d'occultation particulières
  if (additionalTermsToAnnotate && additionalTermsToAnnotate != '') {
    return 'exhaustive';
  }

  const freeDocuments = await documentService.countFreeDocuments();
  const targetFreeDocuments = 15000;
  const nonSensibleMinimumRatio = 0.01;
  const sensibleMinimumRatio = 0.1;

  const ratio = Math.max(0, (targetFreeDocuments - freeDocuments) / targetFreeDocuments);

  // nonSensibleRatio est toujours supérieur a sa limite minimum
  const nonSensibleRatio = ratio < nonSensibleMinimumRatio ? nonSensibleMinimumRatio : ratio;

  // sensibleRatio est 10 fois plus élevé que nonSensibleRatio, toujours supérieur a sa limite minimale, dans la limite logique de 100%
  const sensibleRatio = Math.min(
    1,
    nonSensibleRatio * 10 < sensibleMinimumRatio ? sensibleMinimumRatio : nonSensibleRatio * 10,
  );

  if (sourceName === 'jurica' || sourceName === 'juricav2' || sourceName === 'juritj') {
    const routeFromDb = await getDecisionRoute(NACCode);
    const loggerTech: DecisionLog = {
      operations: ['other', 'computeRouteFromNac'],
      path: 'src/backend/lib/extractRoute/extractRouteForCivilJurisdiction.ts',
      message: `Computing route for NACCode: ${NACCode}`,
      decision: {
        sourceId,
        sourceName,
      },
    };
    switch (routeFromDb) {
      case 'systematique': {
        logger.info({
          ...loggerTech,
          message: `Route systematique trouvée en base, relecture exhaustive appliquée : ${JSON.stringify({
            data: { routeFromDb, routeRelecture: 'exhaustive' },
          })}`,
        });
        return 'exhaustive';
      }
      case 'aleatoireSensible': {
        const routeRelecture = Math.random() < sensibleRatio ? 'exhaustive' : 'automatic';
        logger.info({
          ...loggerTech,
          message: `Route aleatoireSensible trouvée en base, relecture ${routeRelecture} appliquée : ${JSON.stringify({
            data: { routeFromDb, routeRelecture },
          })}`,
        });
        return routeRelecture;
      }
      case 'aleatoireNonSensible': {
        const routeRelecture = Math.random() < nonSensibleRatio ? 'exhaustive' : 'automatic';
        logger.info({
          ...loggerTech,
          message: `Route aleatoireNonSensible trouvée en base, relecture ${routeRelecture} appliquée : ${JSON.stringify(
            {
              data: { routeFromDb, routeRelecture },
            },
          )}`,
        });
        return routeRelecture;
      }
      default:
        throw new Error('Route non trouvée en base');
    }
  } else if (sourceName === 'juritcom') {
    if (!categoriesToOmit.includes(Category.PERSONNEMORALE)) {
      const routeRelecture = Math.random() < sensibleRatio ? 'exhaustive' : 'automatic';
      logger.info({
        operations: ['other', 'computeRouteForTcom'],
        path: 'src/backend/lib/extractRoute/extractRouteForCivilJurisdiction.ts',
        message: `Occultation personneMorale demandée, décision sensible, relecture ${routeRelecture} appliquée. ${JSON.stringify(
          {
            data: { routeRelecture },
          },
        )}`,
        decision: {
          sourceId,
          sourceName,
        },
      });
      return routeRelecture;
    } else {
      const routeRelecture = Math.random() < nonSensibleRatio ? 'exhaustive' : 'automatic';
      logger.info({
        operations: ['other', 'computeRouteForTcom'],
        path: 'src/backend/lib/extractRoute/extractRouteForCivilJurisdiction.ts',
        message: `Occultation personneMorale NON demandée, décision non sensible, relecture ${routeRelecture} appliquée. ${JSON.stringify(
          {
            data: { routeRelecture },
          },
        )}`,
        decision: {
          sourceId,
          sourceName,
        },
      });
      return routeRelecture;
    }
  }

  return 'default';
}

async function fetchApi<T>({
  method,
  path,
  body,
}: {
  method: Method;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  try {
    const response: AxiosResponse = await axios({
      method,
      baseURL: `${DBSDER_API_URL}`,
      url: `/${path}`,
      data: body,
      headers: {
        'x-api-key': DBSDER_API_KEY,
      },
    });

    if (![200, 204].includes(response.status)) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.data as T;
  } catch (error: unknown) {
    throw error;
  }
}

async function getDecisionRoute(code: string): Promise<string | undefined> {
  try {
    const codenac = await fetchApi<CodeNac>({
      method: 'get',
      path: `codenacs/${code}`,
    });

    return codenac.routeRelecture?.toString();
  } catch (error) {
    logger.error({
      operations: ['other', 'getDecisionRoute'],
      path: 'src/backend/lib/extractRoute/extractRouteForCivilJurisdiction.ts',
      message: `Failed to fetch code nac for code "${code}"`,
      stack: `${error}`,
    });
    return undefined;
  }
}
