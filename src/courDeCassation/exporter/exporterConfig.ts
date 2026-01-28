import { exporterConfigType } from '@src/backend';
import { sderApi } from '../sderApi';

export { exporterConfig };

const exporterConfig: exporterConfigType = {
  name: 'SDER',

  async patchDecisionInSder({ externalId, labelTreatments, labelStatus, publishStatus }) {
    await sderApi.patchDecisionInSder({
      externalId,
      labelTreatments,
      labelStatus,
      publishStatus,
    });
  },
  async fetchDecisionByExternalId(externalId) {
    const decision = await sderApi.fetchDecisionByExternalId(externalId);
    return decision;
  },
};
