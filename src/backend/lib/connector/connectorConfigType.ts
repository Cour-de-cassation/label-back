import { AcceptedDocumentTypes } from '@src/core';

export type { connectorConfigType };

type connectorConfigType = {
  name: string;
  fetchCourtDecisionBySourceIdAndSourceName(
    sourceId: number,
    sourceName: string,
  ): Promise<AcceptedDocumentTypes | undefined>;
  fetchDecisionsToPseudonymise(sourceName: string): Promise<{
    next: () => Promise<AcceptedDocumentTypes | undefined>;
    length: number;
  }>;
  updateDocumentLabelStatusToLoaded: (externalId: string) => Promise<void>;
};
