import { documentType } from '@src/core';
import { Deprecated } from '@src/core';

export type { exporterConfigType };

type exporterConfigType = {
  name: string;
  sendDocumentPseudonymisationAndTreatments: (param: {
    externalId: documentType['externalId'];
    pseudoText: string;
    labelTreatments: Deprecated.LabelTreatment[];
  }) => Promise<void>;
};
