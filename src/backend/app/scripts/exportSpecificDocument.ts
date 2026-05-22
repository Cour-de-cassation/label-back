import yargs from 'yargs';
import { withMongo } from './withMongo';
import { loadSettingsFromPath } from './loadSettings';
import { documentType, settingsModule, settingsType, treatmentModule } from '@src/core';
import { documentService } from '../../modules/document';
import { statisticService } from '../../modules/statistic';
import { treatmentService } from '../../modules/treatment';
import { logger } from '../../utils';
import { sderApi } from '@src/courDeCassation/sderApi';
import { nlpApi } from '@src/courDeCassation/nlpApi';
import { Category, LabelStatus, PublishStatus } from 'dbsder-api-types';
import { DecisionLog } from '@src/backend/utils/logger/loggerType';

export { exportSpecificDocument };

if (require.main === module) {
  (async () => {
    const { documentNumber, source, settings: settingsFile } = parseArgv();
    const settings = await loadSettingsFromPath(settingsFile);
    await withMongo(() => exportSpecificDocument({ documentNumber, source }, settings));
  })();
}

function parseArgv() {
  const argv = yargs
    .options({
      documentNumber: {
        demandOption: true,
        description: 'number of the document you want to export',
        type: 'number',
      },
      source: {
        demandOption: true,
        description: 'source (jurinet or jurica) of the document you want to export',
        type: 'string',
      },
      settings: {
        alias: 's',
        demandOption: true,
        description: 'Path to settings.json',
        type: 'string',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return {
    documentNumber: argv.documentNumber as number,
    source: argv.source as string,
    settings: argv.settings as string,
  };
}

async function exportSpecificDocument(
  { documentNumber, source }: { documentNumber: number; source: string },
  settings: settingsType,
) {
  const loggerDecision: DecisionLog = {
    operations: ['other', 'exportSpecificDocument'],
    path: 'src/backend/app/scripts/exportSpecificDocument.ts',
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

  logger.info({ ...loggerDecision, message: 'Document found. Exporting...' });
  await exportDocument(document, settings);
  logger.info({ ...loggerDecision, message: 'DONE' });
}

async function exportDocument(document: documentType, settings: settingsType) {
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
    const currentDecision = await sderApi.fetchDecisionByExternalId(document.externalId);
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
      path: 'src/backend/app/scripts/exportSpecificDocument.ts',
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
      path: 'src/backend/app/scripts/exportSpecificDocument.ts',
      message: `Export failed for document [${document._id} ${document.source} ${document.documentNumber}]`,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
