import { annotationsDiffType, settingsType } from '@src/core';
import { assignationService } from '../../assignation';
import { updateTreatment } from './updateTreatment';
import { ObjectId } from 'mongodb';

export { updateTreatmentForDocumentIdAndUserId };

async function updateTreatmentForDocumentIdAndUserId(
  {
    annotationsDiff,
    documentId,
    userId,
  }: {
    annotationsDiff: annotationsDiffType;
    documentId: ObjectId;
    userId: ObjectId;
  },
  settings: settingsType,
) {
  const assignation = await assignationService.findOrCreateByDocumentIdAndUserId({
    documentId,
    userId,
  });

  return updateTreatment({ annotationsDiff, assignation, settings });
}
