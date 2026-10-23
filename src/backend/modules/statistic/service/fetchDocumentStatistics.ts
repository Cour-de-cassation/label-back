import { findStatisticsWithUserNames } from '../../../connectors/db/statistics';
import { statisticType } from '@src/core';

export { fetchDocumentStatistics };

async function fetchDocumentStatistics(documentNumber: statisticType['documentNumber']) {
  return findStatisticsWithUserNames({ documentNumber: { $eq: documentNumber } });
}
