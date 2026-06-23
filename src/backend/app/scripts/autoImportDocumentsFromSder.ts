import yargs from 'yargs';
import { withMongo } from './withMongo';
import { loadSettingsFromPath } from './loadSettings';
import { annotationModule, annotationType, assignationType, documentType, settingsType } from '@src/core';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { logger } from '../../utils';
import { DecisionLog, TechLog } from '@src/backend/utils/logger/loggerType';
import { treatmentService } from '../../modules/treatment';
import { buildPreAssignator } from '../../lib/preAssignator';
import { assignationService } from '../../modules/assignation';
import { preAssignationService } from '../../modules/preAssignation';
import { statisticService } from '../../modules/statistic';
import { extractRoute } from '../../lib/extractRoute';
import { updateDocumentRoute } from '../../modules/document/service/documentService/updateDocumentRoute';
import { updateDocumentStatus } from '../../modules/document/service/documentService/updateDocumentStatus';
import { getNextStatus } from '@src/core/modules/document/lib';
import { mapCourtDecisionToDocument } from '@src/courDeCassation/connector/mapper/mapCourtDecisionToDocument';
import { sderApi } from '@src/courDeCassation/sderApi';
import { ENV } from '@src/backend/utils/env';

export { importNewDocuments as autoImportDocumentsFromSder };

const SOURCES = ['LOCAL', 'DEV', 'PREPROD'].includes(ENV)
  ? ['jurinet', 'jurica', 'juritj', 'juritcom', 'portalis-cph']
  : ['jurinet', 'jurica', 'juritj', 'juritcom'];

if (require.main === module) {
  (async () => {
    const settings = await loadSettingsFromPath(parseArgv().settings);
    await withMongo(() => importNewDocuments(settings));
  })();
}

function parseArgv() {
  const argv = yargs
    .options({
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

  return { settings: argv.settings as string };
}

async function importNewDocuments(settings: settingsType) {
  const preAssignator = buildPreAssignator();
  const loggerTech: TechLog = {
    operations: ['other', 'importNewDocuments'],
    path: 'src/backend/app/scripts/autoImportDocumentsFromSder.ts',
    message: 'importNewDocuments',
  };
  logger.info({ ...loggerTech, message: 'Starting importNewDocuments...' });

  for (const source of SOURCES) {
    logger.info({ ...loggerTech, message: `Fetching ${source} decisions...` });
    const newDecisionForSource = await sderApi.fetchDecisionsToPseudonymise(source);
    logger.info({
      ...loggerTech,
      message: `${newDecisionForSource.length} ${source} decisions to pseudonymise found.`,
    });

    for (
      let decision = await newDecisionForSource.next();
      decision !== undefined;
      decision = await newDecisionForSource.next()
    ) {
      try {
        if (!decision.originalText || !decision.labelTreatments || decision.labelTreatments.length === 0) {
          throw new Error('Court decision must have an original text and labelTreatments, can not be imported.');
        }
        const document = await mapCourtDecisionToDocument(decision, 'recent');
        await insertDocument(document, settings);

        const lastLabelTreatment = decision.labelTreatments.sort((a, b) => b.order - a.order)[0];

        if (!lastLabelTreatment) {
          throw new Error('Court decision must have a treatment, can not be imported.');
        }

        const annotations: annotationType[] = lastLabelTreatment.annotations.map((annotation) => {
          return annotationModule.lib.buildAnnotation({
            category: annotation.category,
            start: annotation.start,
            text: annotation.text,
            score: annotation.score,
            entityId: annotation.entityId,
            source: annotation.source,
          });
        });

        await treatmentService.createTreatment(
          {
            documentId: document._id,
            previousAnnotations: [],
            nextAnnotations: annotations,
            source: 'reimportedTreatment',
          },
          settings,
        );

        const routeForDocument = await extractRoute(document);
        await updateDocumentRoute(document._id, routeForDocument);

        const isPreassignated = await preAssignator.preAssignDocument({ ...document, route: routeForDocument });
        if (!isPreassignated) {
          const nextStatus = getNextStatus({
            publicationCategory: document.publicationCategory,
            status: document.status,
            route: routeForDocument,
          });
          await updateDocumentStatus(document._id, nextStatus);
        }

        await sderApi.setCourtDecisionLoaded(document.externalId);
      } catch (err) {
        logger.error({ ...loggerTech, message: `${err}` });
      }
    }
  }
}

async function insertDocument(document: documentType, settings: settingsType) {
  const loggerDecision: DecisionLog = {
    operations: ['other', 'insertDocument'],
    path: 'src/backend/app/scripts/autoImportDocumentsFromSder.ts',
    message: 'insert document',
    decision: {
      sourceId: document.documentNumber.toString(),
      sourceName: document.source,
      labelStatus: document.status,
    },
  };
  const documentRepository = buildDocumentRepository();
  let assignations: assignationType[] = [];

  const sameDocument = await documentRepository.findOneByExternalId(document.externalId);
  if (sameDocument) {
    logger.info({
      ...loggerDecision,
      message: `Document ${document.source}:${document.documentNumber} is already in label database, deleting old one.`,
    });

    await statisticService.saveStatisticsOfDocument(sameDocument, settings, 'deleted because new reception');

    if (sameDocument.source === 'jurinet') {
      assignations = await assignationService.fetchAssignationsOfDocumentId(sameDocument._id);
    }
    await documentService.deleteDocument(sameDocument._id);
  }

  try {
    const insertedDocument = documentRepository.insert(document);
    logger.info({
      ...loggerDecision,
      message: `Document ${document.source}:${document.documentNumber} has been inserted in database imported by ${document.importer}`,
    });

    if (assignations.length > 0) {
      logger.info({
        ...loggerDecision,
        message: `Document ${document.source}:${document.documentNumber} previously had an assignation, pre-assigning it.`,
      });
      preAssignationService.createPreAssignation({
        userId: assignations[0].userId,
        source: document.source,
        number: document.documentNumber.toString(),
      });
    }
    return insertedDocument;
  } catch (error) {
    logger.error({
      ...loggerDecision,
      message: `Failed to import ${document.source}:${document.documentNumber} document. ${error}`,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
