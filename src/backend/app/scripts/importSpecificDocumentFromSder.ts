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
import { updateDocumentStatus } from '../../modules/document/service/documentService/updateDocumentStatus';
import { getNextStatus } from '@src/core/modules/document/lib';
import { mapCourtDecisionToDocument } from '@src/courDeCassation/connector/mapper/mapCourtDecisionToDocument';
import { sderApi } from '@src/courDeCassation/sderApi';
import { ENV } from '@src/backend/utils/env';

export { importSpecificDocument as importSpecificDocumentFromSder };

if (require.main === module) {
  (async () => {
    const { documentNumber, source, lowPriority, settings: settingsFile } = parseArgv();
    const settings = await loadSettingsFromPath(settingsFile);
    await withMongo(() => importSpecificDocument({ documentNumber, source, lowPriority, settings }));
  })();
}

function parseArgv() {
  const argv = yargs
    .options({
      documentNumber: {
        demandOption: true,
        description: 'number of the document you want to import',
        type: 'number',
      },
      source: {
        demandOption: true,
        description: 'source (jurinet, jurica or juritj) of the document you want to import',
        type: 'string',
      },
      lowPriority: {
        demandOption: false,
        description: "import without 'request' route and priority 4",
        type: 'boolean',
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
    lowPriority: !!argv.lowPriority as boolean,
    settings: argv.settings as string,
  };
}

async function importSpecificDocument({
  documentNumber,
  source,
  lowPriority,
  settings,
}: {
  documentNumber: number;
  source: string;
  lowPriority: boolean;
  settings: settingsType;
}) {
  const preAssignator = buildPreAssignator();
  const loggerTech: TechLog = {
    operations: ['other', 'importSpecificDocument'],
    path: 'src/backend/app/scripts/importSpecificDocumentFromSder.ts',
    message: 'importSpecificDocument',
  };
  logger.info({
    ...loggerTech,
    message: `START: ${documentNumber} - ${source}, lowPriority: ${lowPriority}`,
  });

  if (!['LOCAL', 'DEV', 'PREPROD'].includes(ENV) && source === 'portalis-cph') {
    logger.info({
      ...loggerTech,
      message: `Source portalis-cph is excluded in PRODUCTION environment.`,
    });
    return;
  }

  try {
    const courtDecision = await sderApi.fetchCourtDecisionBySourceIdAndSourceName(documentNumber, source);

    if (!courtDecision) {
      logger.info({
        ...loggerTech,
        message: 'No court decision found for specified documentNumber and source',
      });
      return;
    }

    if (!courtDecision.originalText || !courtDecision.labelTreatments || courtDecision.labelTreatments.length === 0) {
      logger.info({
        ...loggerTech,
        message: 'Court decision must have an original text and labelTreatments, skipping.',
      });
      return;
    }

    logger.info({
      ...loggerTech,
      message: `Court decision found. labelStatus: ${courtDecision.labelStatus}`,
    });
    const document = await mapCourtDecisionToDocument(courtDecision, 'manual');

    logger.info({
      ...loggerTech,
      message: 'Court decision converted. Inserting document into database...',
    });

    if (lowPriority) {
      await insertDocument({ ...document, route: 'exhaustive' }, settings);
    } else {
      await insertDocument({ ...document, route: 'request', priority: 4, status: 'toBeConfirmed' }, settings);
    }
    logger.info({ ...loggerTech, message: 'Insertion done' });

    const lastLabelTreatment = courtDecision.labelTreatments.sort((a, b) => b.order - a.order)[0];

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

    if (lowPriority) {
      const isPreassignated = await preAssignator.preAssignDocument(document);
      if (!isPreassignated) {
        const nextStatus = getNextStatus({
          publicationCategory: document.publicationCategory,
          status: document.status,
          route: 'exhaustive',
        });
        await updateDocumentStatus(document._id, nextStatus);
      }
    }

    logger.info({
      ...loggerTech,
      message: 'Selected document has been inserted in label database.',
    });
    await sderApi.setCourtDecisionLoaded(document.externalId);
    logger.info({ ...loggerTech, message: 'DONE' });
  } catch (error) {
    logger.error({ ...loggerTech, message: `${error}` });
  }
}

async function insertDocument(document: documentType, settings: settingsType) {
  const loggerDecision: DecisionLog = {
    operations: ['other', 'insertDocument'],
    path: 'src/backend/app/scripts/importSpecificDocumentFromSder.ts',
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
