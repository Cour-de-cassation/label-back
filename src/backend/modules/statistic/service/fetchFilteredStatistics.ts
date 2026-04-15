import { flatten } from 'lodash';
import {
  assignationType,
  ressourceFilterModule,
  ressourceFilterType,
  settingsType,
  statisticsCreator,
  treatmentModule,
} from '@src/core';
import { assignationService } from '../../assignation';
import { documentService } from '../../document';
import { treatmentService } from '../../treatment';
import { buildStatisticRepository } from '../repository';

export { fetchFilteredStatistics };

async function fetchFilteredStatistics(filter: ressourceFilterType, settings: settingsType) {
  const statisticRepository = buildStatisticRepository();

  const statistics = await statisticRepository.findAllByRessourceFilter(filter);
  const doneDocumentStatistics = await computeStatisticsFromDoneDocuments();
  return [...statistics, ...doneDocumentStatistics];

  async function computeStatisticsFromDoneDocuments() {
    const doneDocuments = await documentService.fetchDoneDocuments();
    const lockedDocuments = await documentService.fetchLockedDocuments();
    const allDocuments = [...doneDocuments, ...lockedDocuments];
    const documentIds = allDocuments.map(({ _id }) => _id);

    const assignationsByDocumentId: Record<string, assignationType[] | undefined> =
      await assignationService.fetchAssignationsByDocumentIds(documentIds, {
        assertEveryDocumentIsAssigned: false,
      });
    const treatmentsByDocumentId = await treatmentService.fetchTreatmentsByDocumentIds(documentIds);

    const treatedDocuments = allDocuments.map((document) => {
      const assignations = assignationsByDocumentId[document._id.toHexString()];
      const treatments = treatmentsByDocumentId[document._id.toHexString()];
      const humanTreatments = assignations ? treatmentModule.lib.extractHumanTreatments(treatments, assignations) : [];

      return {
        document,
        treatments,
        humanTreatments,
      };
    });

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
