import { documentType } from '@src/core';
import { Decision, LabelStatus, LabelTreatments, PublishStatus } from 'dbsder-api-types';

export type { exporterConfigType };

type exporterConfigType = {
  name: string;
  patchDecisionInSder: (param: {
    externalId: documentType['externalId'];
    labelTreatments: LabelTreatments;
    labelStatus: LabelStatus;
    publishStatus: PublishStatus;
  }) => Promise<void>;
  fetchDecisionByExternalId: (externalId: documentType['externalId']) => Promise<Decision | undefined>;
};
