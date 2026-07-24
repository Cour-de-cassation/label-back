import { documentType, settingsModule, settingsType, treatmentModule } from '@src/core';
import { documentService } from '../../modules/document';
import { statisticService } from '../../modules/statistic';
import { treatmentService } from '../../modules/treatment';
import { logger } from '../../utils';
import { sderApi } from '@src/courDeCassation/sderApi';
import { nlpApi } from '@src/courDeCassation/nlpApi';
import { Category, LabelStatus, PublishStatus } from 'dbsder-api-types';

export async function exportDocument(document: documentType, settings: settingsType) {
  const treatments = await treatmentService.fetchTreatmentsByDocumentId(document._id);
  const settingsForDocument = settingsModule.lib.computeFilteredSettings(
    settings,
    document.decisionMetadata.categoriesToOmit,
    document.decisionMetadata.additionalTermsToAnnotate,
    document.decisionMetadata.motivationOccultation,
  );

  try {
    const currentDecision = await sderApi.fetchDecisionByExternalId(document.externalId);
    const publishStatus =
      currentDecision?.publishStatus === PublishStatus.BLOCKED ? PublishStatus.BLOCKED : PublishStatus.TOBEPUBLISHED;

    const labelTreatments = treatmentModule.lib.concat(treatments, document.checklist);
    const currentDecisionTreatments = currentDecision?.labelTreatments ?? [];
    const updatedLabelTreatments = labelTreatments
      ? [
          ...currentDecisionTreatments,
          ...labelTreatments.map(({ order, ..._ }) => ({
            ..._,
            order: currentDecisionTreatments.length + order,
          })),
        ]
      : currentDecisionTreatments;

    let currentAffaire = await sderApi.getAffaire({ decisionId: document.externalId });

    const categoriesToOccult = (
      Object.entries(settingsForDocument)
        .filter(([_, categorySetting]) => categorySetting.status == 'annotable')
        .map(([category]) => category) as Category[]
    ).filter((_) => _ !== Category.MOTIVATIONS);

    const replacementTerms = await nlpApi.getPseudo(
      document.externalId,
      currentAffaire._id.toString(),
      updatedLabelTreatments.map((_) => ({
        ..._,
        annotations: _.annotations.filter((_) => _.category !== Category.MOTIVATIONS),
      })),
      currentAffaire.replacementTerms,
      categoriesToOccult,
    );

    await sderApi.patchAffaire(currentAffaire._id.toString(), replacementTerms);

    await sderApi.patchDecisionInSder({
      externalId: document.externalId,
      labelTreatments: updatedLabelTreatments,
      labelStatus: LabelStatus.DONE,
      publishStatus: publishStatus,
    });
    logger.info({
      operations: ['other', 'exportDocument'],
      path: 'src/backend/app/scripts/exportDocument.ts',
      message: `Document ${document.source}:${document.documentNumber} has been exported`,
      decision: {
        sourceId: document.documentNumber.toString(),
        sourceName: document.source,
      },
    });

    await statisticService.saveStatisticsOfDocument(document, settings, 'exported');
    await documentService.deleteDocument(document._id);
  } catch (error) {
    logger.error({
      operations: ['other', 'exportDocument'],
      path: 'src/backend/app/scripts/exportDocument.ts',
      message: `Export failed for document [${document._id} ${document.source} ${document.documentNumber}]`,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
