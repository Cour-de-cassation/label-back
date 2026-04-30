import { documentType } from '@src/core';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { NLP_API_URL } from '@src/backend/utils/env';
import { Category, LabelTreatments, ReplacementTerm } from 'dbsder-api-types';

export const nlpApi = {
  async getPseudo(
    externalId: documentType['externalId'],
    affaireId: string,
    labelTreatments: LabelTreatments,
    replacementTerms: ReplacementTerm[],
    categoriesToOccult: Category[],
  ): Promise<ReplacementTerm[]> {
    return await axios({
      method: 'post',
      baseURL: `${NLP_API_URL}`,
      url: `/pseudo`,
      data: { externalId, affaireId, labelTreatments, replacementTerms, categoriesToOccult },
    })
      .then((response: AxiosResponse<ReplacementTerm[]>) => {
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
        throw new Error(`${error.code ?? 'Unknown'} on /pseudo`);
      });
  },
};
