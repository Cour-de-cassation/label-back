import { documentType } from '@src/core';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Deprecated } from '@src/core';

export const nlpApi = {
  async getPseudo(
    externalId: documentType['externalId'],
    affaireId: string,
    labelTreatments: Deprecated.LabelTreatment[],
    replacementTerms: Deprecated.replacementTerms[],
    categoriesToOccult: Deprecated.Category[],
  ): Promise<Deprecated.replacementTerms[]> {
    return await axios({
      method: 'post',
      baseURL: `${process.env.NLP_API_URL}`,
      url: `/pseudo`,
      data: { externalId, affaireId, labelTreatments, replacementTerms, categoriesToOccult },
    })
      .then((response: AxiosResponse<Deprecated.replacementTerms[]>) => {
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
