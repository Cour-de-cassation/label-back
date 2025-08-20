import { documentType } from '@src/core';
import { Deprecated } from '@src/core';

export type { connectorConfigType };

type connectorConfigType = {
  name: string;
  fetchCourtDecisionBySourceIdAndSourceName(
    sourceId: number,
    sourceName: string,
  ): Promise<Deprecated.DecisionDTO | undefined>;
  fetchDecisionsToPseudonymise(
    sourceName: string,
  ): Promise<{
    next: () => Promise<Deprecated.DecisionDTO | undefined>;
    length: number;
  }>;
  updateDocumentLabelStatusToLoaded: (externalId: string) => Promise<void>;
  mapCourtDecisionToDocument: (
    courtDecision: Deprecated.DecisionDTO,
    importer: documentType['importer'],
  ) => Promise<documentType>;
};
