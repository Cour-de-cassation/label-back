import { documentType } from '@src/core';
import { Decision } from 'dbsder-api-types';

export type { connectorConfigType };

type connectorConfigType = {
  name: string;
  fetchCourtDecisionBySourceIdAndSourceName(sourceId: number, sourceName: string): Promise<Decision | undefined>;
  fetchDecisionsToPseudonymise(sourceName: string): Promise<{
    next: () => Promise<Decision | undefined>;
    length: number;
  }>;
  updateDocumentLabelStatusToLoaded: (externalId: string) => Promise<void>;
  mapCourtDecisionToDocument: (courtDecision: Decision, importer: documentType['importer']) => Promise<documentType>;
};
