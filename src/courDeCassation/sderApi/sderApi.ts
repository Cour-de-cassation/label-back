import { AcceptedDocumentTypes, documentType } from '@src/core';
import axios, { AxiosError, AxiosResponse, Method } from 'axios';
import QueryString from 'qs';
import { DBSDER_API_URL, DBSDER_API_KEY } from '@src/backend/utils/env';
import { Affaire, LabelStatus, LabelTreatments, PublishStatus, ReplacementTerm } from 'dbsder-api-types';

export { sderApi };

async function fetchApi<T = Record<string, unknown>>({
  method,
  path,
  body,
  query,
}: {
  method: Method;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}) {
  return await axios({
    method: method,
    baseURL: `${DBSDER_API_URL}`,
    url: query ? `/${path}?${QueryString.stringify(query)}` : `/${path}`,
    data: body,
    headers: {
      'x-api-key': DBSDER_API_KEY,
    },
  })
    .then((response: AxiosResponse<T>) => {
      if (response.status != 200 && response.status != 204) {
        throw new Error(`${response.status} ${response.statusText}`);
      } else {
        return response.data;
      }
    })
    .catch((error: AxiosError) => {
      if (error.response) {
        throw new Error(`${error.response.status} ${error.response.statusText}`);
      }
      throw new Error(`${error.code ?? 'Unknown'} on /${path}`);
    });
}

async function fetchDecisions(query: Record<string, unknown>) {
  type Response = {
    decisions: AcceptedDocumentTypes[];
    totalDecisions: number;
    nextCursor?: string;
  };
  const decisions = await fetchApi<Response>({
    method: 'get',
    path: `decisions`,
    query,
  });

  return decisions;
}

const sderApi = {
  async fetchDecisionsToPseudonymise(sourceName: string) {
    let response = await fetchDecisions({
      labelStatus: 'toBeTreated',
      sourceName,
    });
    response.decisions = response.decisions.filter(({ originalText }) => !!originalText);
    let index = 0;

    return {
      length: response.totalDecisions,
      next: async () => {
        const decision = response.decisions[index];
        index++;
        if (!!decision) return decision;

        if (response.nextCursor) {
          response = await fetchDecisions({
            labelStatus: 'toBeTreated',
            sourceName,
            searchAfter: response.nextCursor,
          });
          response.decisions = response.decisions.filter(({ originalText }) => !!originalText);
          index = 1;
          return response.decisions[0];
        }

        return undefined;
      },
    };
  },

  async fetchCourtDecisionBySourceIdAndSourceName(
    sourceId: number,
    sourceName: string,
  ): Promise<AcceptedDocumentTypes | undefined> {
    const decisionList = await fetchDecisions({ sourceId, sourceName });

    if (decisionList.decisions.length > 0) {
      return decisionList.decisions[0];
    }
    return undefined;
  },

  async fetchDecisionByExternalId(externalId: documentType['externalId']): Promise<AcceptedDocumentTypes | undefined> {
    const decision = await fetchApi<AcceptedDocumentTypes>({
      method: 'get',
      path: `decisions/${externalId}`,
    });
    return decision;
  },

  async setCourtDecisionLoaded(externalId: string) {
    await fetchApi({
      method: 'patch',
      path: `decisions/${externalId}`,
      body: { labelStatus: 'loaded' },
    });
  },

  async patchDecisionInSder({
    externalId,
    labelTreatments,
    labelStatus,
    publishStatus,
  }: {
    externalId: documentType['externalId'];
    labelTreatments: LabelTreatments;
    labelStatus: LabelStatus;
    publishStatus: PublishStatus;
  }) {
    await fetchApi({
      method: 'patch',
      path: `decisions/${externalId}`,
      body: {
        labelTreatments,
        labelStatus,
        publishStatus,
      },
    });
  },

  async getAffaire(query: Record<string, unknown>): Promise<Affaire> {
    const affaire = await fetchApi<Affaire>({
      method: 'get',
      path: `affaires`,
      query,
    });
    return affaire;
  },

  async patchAffaire(externalId: string, replacementTerms: ReplacementTerm[]): Promise<Affaire> {
    const affaire = await fetchApi<Affaire>({
      method: 'patch',
      path: `affaires/${externalId}`,
      body: { replacementTerms },
    });
    return affaire;
  },
};
