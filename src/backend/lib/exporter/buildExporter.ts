import { documentType, settingsModule, settingsType, treatmentModule } from '@src/core';
import { documentService } from '../../modules/document';
import { statisticService } from '../../modules/statistic';
import { treatmentService } from '../../modules/treatment';
import { logger } from '../../utils';
import { exporterConfigType } from './exporterConfigType';
import { sderApi } from '@src/courDeCassation/sderApi';
import { nlpApi } from '@src/courDeCassation/nlpApi';
import { Category, LabelStatus, PublishStatus } from 'dbsder-api-types';
import { DecisionLog, TechLog } from '@src/backend/utils/logger/loggerType';

export { buildExporter };

function buildExporter(exporterConfig: exporterConfigType, settings: settingsType) {
  return {
    exportAllTreatedDocuments,
    exportSpecificDocument,
    exportTreatedDocumentsSince,
    exportTreatedPublishableDocuments,
  };

  async function exportTreatedDocumentsSince(days: number) {
    const loggerTech: TechLog = {
      operations: ['other', 'exportTreatedDocumentsSince'],
      path: 'src/backend/lib/exporter/buildExporter.ts',
      message: `START: Exportation to ${exporterConfig.name}`,
    };
    logger.info(loggerTech);

    logger.info({
      ...loggerTech,
      message: `Fetching treated documents...`,
    });
    const documentsReadyToExport = await documentService.fetchDocumentsReadyToExport(days);
    logger.info({
      ...loggerTech,
      message: `${documentsReadyToExport.length} documents to export`,
    });

    logger.info({
      ...loggerTech,
      message: `Beginning exportation...`,
    });
    for (let index = 0; index < documentsReadyToExport.length; index++) {
      logger.info({
        ...loggerTech,
        message: `Exportation of document ${index + 1}/${documentsReadyToExport.length}`,
      });
      const document = documentsReadyToExport[index];

      await exportDocument(document);
    }

    logger.info({ ...loggerTech, message: 'DONE' });
  }

  async function exportTreatedPublishableDocuments() {
    const loggerTech: TechLog = {
      operations: ['other', 'exportTreatedPublishableDocuments'],
      path: 'src/backend/lib/exporter/buildExporter.ts',
      message: `START: Exportation to ${exporterConfig.name}`,
    };

    logger.info({
      ...loggerTech,
      message: `START: Exportation to ${exporterConfig.name}`,
    });

    logger.info({
      ...loggerTech,
      message: `Fetching treated documents from today...`,
    });
    const documentsReadyToExport = await documentService.fetchPublishableDocumentsToExport();
    logger.info({
      ...loggerTech,
      message: `${documentsReadyToExport.length} documents to export`,
    });

    logger.info({
      ...loggerTech,
      message: `Beginning exportation...`,
    });
    for (let index = 0; index < documentsReadyToExport.length; index++) {
      logger.info({
        ...loggerTech,
        message: `Exportation of document ${index + 1}/${documentsReadyToExport.length}`,
      });
      const document = documentsReadyToExport[index];

      await exportDocument(document);
    }

    logger.info({
      ...loggerTech,
      message: 'DONE',
    });
  }

  async function exportSpecificDocument({ documentNumber, source }: { documentNumber: number; source: string }) {
    const loggerDecision: DecisionLog = {
      operations: ['other', 'exportSpecificDocument'],
      path: 'src/backend/lib/exporter/buildExporter.ts',
      message: `Export specific document ${source}:${documentNumber}`,
      decision: {
        sourceId: documentNumber.toString(),
        sourceName: source,
      },
    };
    logger.info({
      ...loggerDecision,
      message: `START: documentNumber ${documentNumber} - source ${source}`,
    });
    const document = await documentService.fetchDocumentBySourceAndDocumentNumber({ documentNumber, source });

    if (!document) {
      logger.error({
        ...loggerDecision,
        message: `The document you specified (documentNumber ${documentNumber} - source ${source}) does not exist in the database`,
      });
      return;
    }

    if (document.status !== 'toBePublished' && document.status !== 'done') {
      logger.error({
        ...loggerDecision,
        message: `The document you specified has been found, but is not ready to be exported (status: ${document.status})`,
      });
      return;
    }

    logger.info({
      ...loggerDecision,
      message: `Document found. Exporting...`,
    });

    await exportDocument(document);

    logger.info({ ...loggerDecision, message: 'DONE' });
  }

  async function exportAllTreatedDocuments() {
    const loggerTech: TechLog = {
      operations: ['other', 'exportAllTreatedDocuments'],
      path: 'src/backend/lib/exporter/buildExporter.ts',
      message: `START: Exportation to ${exporterConfig.name}`,
    };
    logger.info({
      ...loggerTech,
      message: `START: Exportation to ${exporterConfig.name}`,
    });

    logger.info({
      ...loggerTech,
      message: `Fetching all treated documents...`,
    });
    const documentsToExport = await documentService.fetchAllExportableDocuments();
    logger.info({
      ...loggerTech,
      message: `${documentsToExport.length} documents to export`,
    });

    logger.info({
      ...loggerTech,
      message: `Beginning exportation...`,
    });
    for (let index = 0; index < documentsToExport.length; index++) {
      logger.info({
        ...loggerTech,
        message: `Exportation of document ${index + 1}/${documentsToExport.length}`,
      });
      const document = documentsToExport[index];

      await exportDocument(document);
    }

    logger.info({ ...loggerTech, message: 'DONE' });
  }

  async function exportDocument(document: documentType) {
    const treatments = await treatmentService.fetchTreatmentsByDocumentId(document._id);
    const settingsForDocument = settingsModule.lib.computeFilteredSettings(
      settings,
      document.decisionMetadata.categoriesToOmit,
      document.decisionMetadata.additionalTermsToAnnotate,
      document.decisionMetadata.computedAdditionalTerms,
      document.decisionMetadata.additionalTermsParsingFailed,
      document.decisionMetadata.motivationOccultation,
    );

    try {
      const currentDecision = await exporterConfig.fetchDecisionByExternalId(document.externalId);
      const publishStatus =
        currentDecision?.publishStatus === PublishStatus.BLOCKED ? PublishStatus.BLOCKED : PublishStatus.TOBEPUBLISHED;

      const labelTreatments = treatmentModule.lib.concat(treatments, document.nlpVersions, document.checklist);
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
      )
        // MOTIVATIONS NOT SEND TO GETPSEUDO:
        .filter((_) => _ !== Category.MOTIVATIONS);

      const replacementTerms = await nlpApi.getPseudo(
        document.externalId,
        currentAffaire._id.toString(),
        updatedLabelTreatments // MOTIVATIONS NOT SEND TO GETPSEUDO:
          .map((_) => ({ ..._, annotations: _.annotations.filter((_) => _.category !== Category.MOTIVATIONS) })),
        currentAffaire.replacementTerms,
        categoriesToOccult,
      );

      await sderApi.patchAffaire(currentAffaire._id.toString(), replacementTerms);

      await exporterConfig.patchDecisionInSder({
        externalId: document.externalId,
        labelTreatments: updatedLabelTreatments,
        labelStatus: LabelStatus.DONE,
        publishStatus: publishStatus,
      });
      logger.info({
        operations: ['other', 'exportDocument'],
        path: 'src/backend/lib/exporter/buildExporter.ts',
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
        path: 'src/backend/lib/exporter/buildExporter.ts',
        message: `Export failed for document [${document._id} ${document.source} ${document.documentNumber}]`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}
