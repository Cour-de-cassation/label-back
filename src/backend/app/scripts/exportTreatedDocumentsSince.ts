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
import { TechLog } from '@src/backend/utils/logger/loggerType';

export { exportTreatedDocumentsSince };

if (require.main === module) {
  (async () => {
    const { days, settings: settingsFile } = parseArgv();
    const settings = await loadSettingsFromPath(settingsFile);
    await withMongo(() => exportTreatedDocumentsSince(days, settings));
  })();
}

function parseArgv() {
  const argv = yargs
    .options({
      days: {
        demandOption: true,
        description: 'treated since days',
        type: 'number',
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

  return { days: argv.days as number, settings: argv.settings as string };
}

async function exportTreatedDocumentsSince(days: number, settings: settingsType) {
  const loggerTech: TechLog = {
    operations: ['other', 'exportTreatedDocumentsSince'],
    path: 'src/backend/app/scripts/exportTreatedDocumentsSince.ts',
    message: 'START: Exportation to SDER',
  };
  logger.info(loggerTech);

  logger.info({ ...loggerTech, message: 'Fetching treated documents...' });
  const documentsReadyToExport = await documentService.fetchDocumentsReadyToExport(days);
  logger.info({ ...loggerTech, message: `${documentsReadyToExport.length} documents to export` });

  logger.info({ ...loggerTech, message: 'Beginning exportation...' });
  for (let index = 0; index < documentsReadyToExport.length; index++) {
    logger.info({ ...loggerTech, message: `Exportation of document ${index + 1}/${documentsReadyToExport.length}` });
    await exportDocument(documentsReadyToExport[index], settings);
  }

  logger.info({ ...loggerTech, message: 'DONE' });
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
      path: 'src/backend/app/scripts/exportTreatedDocumentsSince.ts',
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
      path: 'src/backend/app/scripts/exportTreatedDocumentsSince.ts',
      message: `Export failed for document [${document._id} ${document.source} ${document.documentNumber}]`,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
