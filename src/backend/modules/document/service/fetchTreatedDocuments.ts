import { settingsType, treatmentModule } from '@src/core';
import { findTreatedDocuments } from '../../../connectors/db/documents';
import { findTreatments } from '../../../connectors/db/treatments';

export { fetchTreatedDocuments };

async function fetchTreatedDocuments(settings: settingsType) {
  const treatedDocuments = await findTreatedDocuments();

  return Promise.all(
    treatedDocuments.map(async ({ humanTreatmentsCount, humanTreatmentIds, ...treatedDocument }) => {
      if (humanTreatmentsCount === 0) {
        throw new Error(`No human treatment found for document ${treatedDocument.document._id.toHexString()}`);
      }
      if (!humanTreatmentIds) {
        return treatedDocument;
      }

      // Several human treatments: annotations counts depend on the settings
      const humanTreatments = (await findTreatments({ _id: { $in: humanTreatmentIds } })).sort(
        (treatment1, treatment2) => treatment1.order - treatment2.order,
      );
      const { subAnnotationsNonSensitiveCount, surAnnotationsCount, subAnnotationsSensitiveCount } =
        treatmentModule.lib.aggregateTreatmentInfo(humanTreatments, settings);

      return {
        ...treatedDocument,
        statistic: { subAnnotationsNonSensitiveCount, surAnnotationsCount, subAnnotationsSensitiveCount },
      };
    }),
  );
}
