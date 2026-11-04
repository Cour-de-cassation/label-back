import { flatten } from 'lodash';
import {
  ressourceFilterModule,
  ressourceFilterType,
  settingsType,
  statisticsCreator,
  treatmentModule,
} from '@src/core';
import { findDocumentsWithTreatments } from '../../../connectors/db/documents';
import { findStatistics } from '../../../connectors/db/statistics';
import { buildRessourceFilterRequest } from '../../ressourceFilter';

export { fetchFilteredStatistics };

async function fetchFilteredStatistics(filter: ressourceFilterType, settings: settingsType) {
  const statistics = await findStatistics(buildRessourceFilterRequest(filter));
  const doneDocumentStatistics = await computeStatisticsFromDoneDocuments();
  return [...statistics, ...doneDocumentStatistics];

  async function computeStatisticsFromDoneDocuments() {
    const documentsWithTreatments = await findDocumentsWithTreatments({ status: { $in: ['done', 'locked'] } });

    const treatedDocuments = documentsWithTreatments.map(
      ({ assignations, assignedUsers: _, treatments, ...document }) => ({
        document,
        treatments,
        humanTreatments: treatmentModule.lib.extractHumanTreatments(treatments, assignations),
      }),
    );

    const filteredTreatedDocuments = ressourceFilterModule.lib.filterTreatedDocuments({
      ressourceFilter: filter,
      treatedDocuments,
    });

    return flatten(
      filteredTreatedDocuments.map(({ document, treatments, humanTreatments }) =>
        statisticsCreator.buildFromDocument({
          humanTreatments,
          document,
          treatments,
          settings,
        }),
      ),
    );
  }
}
