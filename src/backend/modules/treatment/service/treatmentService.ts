import { ObjectId } from 'mongodb';
import { annotationsDiffType, documentType, indexer, settingsType, treatmentModule, treatmentType } from '@src/core';
import {
  countTreatments,
  deleteTreatments,
  findTreatedDocumentIds,
  findTreatmentById,
  findTreatments,
  insertTreatment,
  updateTreatmentById,
} from '../../../connectors/db/treatments';
import { assignationService } from '../../assignation';
import { createTreatment } from './createTreatment';
import { fetchAnnotationsDiffDetailsForDocument } from './fetchAnnotationsDiffDetailsForDocument';
import { updateTreatment } from './updateTreatment';

export { treatmentService };

const treatmentService = {
  createTreatment,
  fetchAnnotationsDiffDetailsForDocument,
  updateTreatment,

  async countTreatmentsByDocumentId({ documentId }: { documentId: documentType['_id'] }) {
    return countTreatments({ documentId });
  },

  async createEmptyTreatment({
    documentId,
    source,
  }: {
    documentId: documentType['_id'];
    source: treatmentType['source'];
  }): Promise<treatmentType['_id']> {
    const previousTreatments = await findTreatments({ documentId });
    const sortedTreatments = treatmentModule.lib.sortInConsistentOrder(previousTreatments);
    const order = sortedTreatments.length > 0 ? sortedTreatments[sortedTreatments.length - 1].order + 1 : 0;

    const treatment = treatmentModule.lib.buildEmpty({
      annotationsDiff: { before: [], after: [] },
      documentId,
      order,
      source,
    });

    await insertTreatment(treatment);

    return treatment._id;
  },

  async deleteTreatmentsByDocumentId(documentId: treatmentType['documentId']) {
    await deleteTreatments({ documentId });
  },

  async fetchAnnotationsOfDocument(documentId: ObjectId) {
    const treatments = await findTreatments({ documentId });
    return treatmentModule.lib.computeAnnotations(treatments);
  },

  async fetchTreatedDocumentIds() {
    return findTreatedDocumentIds();
  },

  async fetchTreatmentsByDocumentId(documentId: ObjectId) {
    return findTreatments({ documentId });
  },

  async fetchTreatmentsByDocumentIds(documentIds: ObjectId[]) {
    const treatments = await findTreatments({ documentId: { $in: documentIds } });
    const sortedTreatments = treatments.sort((treatmentA, treatmentB) => treatmentA.order - treatmentB.order);
    const treatmentsByDocumentIds = indexer.indexManyBy(sortedTreatments, (treatment) =>
      treatment.documentId.toHexString(),
    );

    indexer.assertEveryIdIsDefined(
      documentIds.map((documentId) => documentId.toHexString()),
      treatmentsByDocumentIds,
      (_id) => `The document id ${_id} has no matching treatments`,
    );

    return treatmentsByDocumentIds;
  },

  async resetTreatmentLastUpdateDate(treatmentId: treatmentType['_id']) {
    await updateTreatmentById(treatmentId, { lastUpdateDate: new Date().getTime() });
  },

  async updateTreatmentDuration(treatmentId: treatmentType['_id']) {
    const treatment = await findTreatmentById(treatmentId);
    const now = new Date();
    const elapsedTimeSinceLastUpdate = now.getTime() - treatment.lastUpdateDate;

    const duration =
      elapsedTimeSinceLastUpdate < treatmentModule.lib.getTimeThresholdToUpdateDuration()
        ? elapsedTimeSinceLastUpdate + treatment.duration
        : treatment.duration;

    await updateTreatmentById(treatmentId, { duration, lastUpdateDate: now.getTime() });
  },

  async updateTreatmentForDocumentIdAndUserId(
    {
      annotationsDiff,
      documentId,
      userId,
    }: { annotationsDiff: annotationsDiffType; documentId: ObjectId; userId: ObjectId },
    settings: settingsType,
  ) {
    const assignation = await assignationService.findOrCreateByDocumentIdAndUserId({ documentId, userId });
    return updateTreatment({ annotationsDiff, assignation, settings });
  },
};
