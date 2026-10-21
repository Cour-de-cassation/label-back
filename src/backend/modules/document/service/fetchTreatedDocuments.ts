import { sumBy } from 'lodash';
import { settingsType, treatmentModule } from '@src/core';
import { findDocumentsWithTreatments } from '../../../connectors/db/documents';
import { getAssignedUserName } from './getAssignedUserName';

export { fetchTreatedDocuments };

async function fetchTreatedDocuments(settings: settingsType) {
  const treatedDocuments = await findDocumentsWithTreatments({ status: { $in: ['done'] } }, [
    '_id',
    'decisionMetadata',
    'creationDate',
    'documentNumber',
    'publicationCategory',
    'reviewStatus',
    'source',
    'route',
  ]);

  return treatedDocuments.map(({ assignations, assignedUsers, treatments, ...treatedDocument }) => {
    let totalTreatmentDuration: number | undefined,
      lastTreatmentDate: number | undefined,
      subAnnotationsNonSensitiveCount: number | undefined,
      surAnnotationsCount: number | undefined,
      subAnnotationsSensitiveCount: number | undefined = undefined;
    let userNames: string[] = [];
    if (assignations.length > 0) {
      const humanTreatments = treatmentModule.lib.extractHumanTreatments(treatments, assignations);
      if (humanTreatments.length === 0) {
        throw new Error(`No human treatment found for document ${treatedDocument._id.toHexString()}`);
      }
      userNames = humanTreatments.map(({ userId }) => getAssignedUserName(assignedUsers, userId));
      totalTreatmentDuration = sumBy(humanTreatments, ({ treatment }) => treatment.duration);
      lastTreatmentDate = humanTreatments[humanTreatments.length - 1].treatment.lastUpdateDate;

      if (humanTreatments.length === 1) {
        const humanTreatment = humanTreatments[0];
        subAnnotationsNonSensitiveCount = humanTreatment.treatment.subAnnotationsNonSensitiveCount;
        subAnnotationsSensitiveCount = humanTreatment.treatment.subAnnotationsSensitiveCount;
        surAnnotationsCount = humanTreatment.treatment.surAnnotationsCount;
      } else {
        const treatmentInfo = treatmentModule.lib.aggregateTreatmentInfo(
          humanTreatments.map(({ treatment }) => treatment),
          settings,
        );
        subAnnotationsNonSensitiveCount = treatmentInfo.subAnnotationsNonSensitiveCount;
        subAnnotationsSensitiveCount = treatmentInfo.subAnnotationsSensitiveCount;
        surAnnotationsCount = treatmentInfo.surAnnotationsCount;
      }
    }

    return {
      document: {
        _id: treatedDocument._id,
        creationDate: treatedDocument.creationDate,
        documentNumber: treatedDocument.documentNumber,
        jurisdiction: treatedDocument.decisionMetadata.jurisdiction,
        occultationBlock: treatedDocument.decisionMetadata.occultationBlock,
        publicationCategory: treatedDocument.publicationCategory,
        reviewStatus: treatedDocument.reviewStatus,
        route: treatedDocument.route,
        source: treatedDocument.source,
      },
      totalTreatmentDuration,
      lastTreatmentDate,
      statistic: {
        subAnnotationsNonSensitiveCount,
        surAnnotationsCount,
        subAnnotationsSensitiveCount,
      },
      userNames,
    };
  });
}
