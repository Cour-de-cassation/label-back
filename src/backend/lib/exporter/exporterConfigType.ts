import { documentType } from '@src/core';
import { Deprecated } from '@src/core';

export type { exporterConfigType };

type exporterConfigType = {
  name: string;
  updateDecisionPseudonymisation: (param: {
    externalId: documentType['externalId'];
    labelTreatments: Deprecated.LabelTreatment[];
    labelStatus: Deprecated.LabelStatus;
    publishStatus: Deprecated.PublishStatus;
  }) => Promise<void>;
  fetchDecisionByExternalId: (externalId: documentType['externalId']) => Promise<Deprecated.DecisionDTO | undefined>;
};
