import { dateBuilder, ressourceFilterType, settingsType, statisticModule, userType } from '@src/core';
import { logger } from '../../../utils';
import { deleteStatistics, unsetStatisticsTreatmentsSummaryUserId } from '../../../connectors/db/statistics';
import { documentService } from '../../document';
import { fetchAvailableStatisticFilters } from './fetchAvailableStatisticFilters';
import { fetchDocumentStatistics } from './fetchDocumentStatistics';
import { fetchFilteredStatistics } from './fetchFilteredStatistics';
import { saveStatisticsOfDocument } from './saveStatisticsOfDocument';

export { statisticService };

const statisticService = {
  fetchAvailableStatisticFilters,
  fetchDocumentStatistics,
  fetchFilteredStatistics,
  saveStatisticsOfDocument,

  async deleteStaticticsBefore({ since, unit }: { since: number; unit: 'MONTHS' }) {
    const count = await deleteStatistics({ treatmentDate: { $lte: computeExpirationDate(since, unit) } });

    logger.info({
      operations: ['other', 'deleteStaticticsBefore'],
      path: 'src/backend/modules/statistic/service/statisticService.ts',
      message: `START: ${since}${unit}: ${count} statistics deleted`,
    });
  },

  async deleteTreatmentsSummaryBefore({ since, unit }: { since: number; unit: 'MONTHS' }) {
    const count = await unsetStatisticsTreatmentsSummaryUserId({
      treatmentDate: { $lte: computeExpirationDate(since, unit) },
    });

    logger.info({
      operations: ['other', 'deleteTreatmentsSummaryBefore'],
      path: 'src/backend/modules/statistic/service/statisticService.ts',
      message: `START: ${since} ${unit}: ${count} treatments summary deleted`,
    });
  },

  async fetchAggregatedStatisticsAccordingToFilter(filter: ressourceFilterType, settings: settingsType) {
    const statistics = await fetchFilteredStatistics(filter, settings);
    return statisticModule.lib.aggregate(statistics, filter);
  },

  async fetchPersonalStatistics(user: userType, settings: settingsType) {
    const filter = {
      userId: user._id,
      mustHaveSurAnnotations: false,
      mustHaveSubAnnotations: false,
      publicationCategory: undefined,
      startDate: dateBuilder.daysAgo(10),
      endDate: new Date().getTime(),
      route: undefined,
      source: undefined,
      importer: undefined,
      jurisdiction: undefined,
    };

    const statistics = await fetchFilteredStatistics(filter, settings);
    return Object.values(statisticModule.lib.dailyCount(statistics));
  },

  async fetchSummary() {
    return {
      freeDocuments: await documentService.countFreeDocuments(),
      pendingDocuments: await documentService.countPendingDocuments(),
      savedDocuments: await documentService.countSavedDocuments(),
      doneDocuments: await documentService.countDoneDocuments(),
      lockedDocuments: await documentService.countLockedDocuments(),
    };
  },
};

function computeExpirationDate(since: number, unit: 'MONTHS') {
  switch (unit) {
    case 'MONTHS':
      return dateBuilder.monthsAgo(since);
  }
}
