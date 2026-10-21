import { sumBy } from 'lodash';
import { treatmentModule } from '@src/core';
import { findDocumentsWithTreatments } from '../../../connectors/db/documents';
import { getAssignedUserName } from './getAssignedUserName';

export { fetchToBeConfirmedDocuments };

async function fetchToBeConfirmedDocuments() {
  const toBeConfirmedDocuments = await findDocumentsWithTreatments({ status: { $in: ['toBeConfirmed'] } }, [
    '_id',
    'decisionMetadata',
    'documentNumber',
    'publicationCategory',
    'reviewStatus',
    'route',
  ]);

  return toBeConfirmedDocuments.map(({ assignations, assignedUsers, treatments, ...toBeConfirmedDocument }) => {
    let totalTreatmentDuration: number | undefined, lastTreatmentDate: number | undefined;
    let userNames: string[] = [];
    if (assignations.length > 0) {
      const humanTreatments = treatmentModule.lib.extractHumanTreatments(treatments, assignations);

      userNames = humanTreatments.map(({ userId }) => getAssignedUserName(assignedUsers, userId));
      totalTreatmentDuration = sumBy(humanTreatments, ({ treatment }) => treatment.duration);

      lastTreatmentDate = humanTreatments[humanTreatments.length - 1].treatment.lastUpdateDate;
    }

    return {
      document: {
        _id: toBeConfirmedDocument._id,
        documentNumber: toBeConfirmedDocument.documentNumber,
        jurisdiction: toBeConfirmedDocument.decisionMetadata.jurisdiction,
        occultationBlock: toBeConfirmedDocument.decisionMetadata.occultationBlock,
        publicationCategory: toBeConfirmedDocument.publicationCategory,
        route: toBeConfirmedDocument.route,
        reviewStatus: toBeConfirmedDocument.reviewStatus,
      },
      totalTreatmentDuration,
      lastTreatmentDate,
      userNames,
    };
  });
}
