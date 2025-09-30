import { problemReportType } from '@src/core';

export type { customProblemReportRepositoryType };

type customProblemReportRepositoryType = {
  deleteByDocumentId: (documentId: problemReportType['documentId']) => Promise<void>;
};
