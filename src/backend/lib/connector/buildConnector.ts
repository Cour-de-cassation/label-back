import { annotationModule, annotationType, assignationType, documentType, settingsType } from '@src/core';
import { buildDocumentRepository, documentService } from '../../modules/document';
import { logger } from '../../utils';
import { DecisionLog, TechLog } from '@src/backend/utils/logger/loggerType';
import { connectorConfigType } from './connectorConfigType';
import { treatmentService } from '../../modules/treatment';
import { buildPreAssignator } from '../preAssignator';
import { Deprecated } from '@src/core';
import { assignationService } from '../../modules/assignation';
import { preAssignationService } from '../../modules/preAssignation';
import { statisticService } from '../../modules/statistic';
import { extractRoute } from '../extractRoute';
import { updateDocumentRoute } from '../../modules/document/service/documentService/updateDocumentRoute';
import { updateDocumentStatus } from '../../modules/document/service/documentService/updateDocumentStatus';
import { getNextStatus } from '@src/core/modules/document/lib';

export { buildConnector };

function buildConnector(connectorConfig: connectorConfigType) {
  const preAssignator = buildPreAssignator();

  return {
    importSpecificDocument,
    importNewDocuments,
  };

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
    const logerTech: TechLog = {
      operations: ['other', 'importSpecificDocument'],
      path: 'src/backend/lib/connector/buildConnector.ts',
      message: 'importSpecificDocument',
    };
    logger.info({
      ...logerTech,
      message: `START: ${documentNumber} - ${source}, lowPriority: ${lowPriority}`,
    });

    try {
      const courtDecision = await connectorConfig.fetchCourtDecisionBySourceIdAndSourceName(documentNumber, source);

      if (!courtDecision) {
        logger.info({
          ...logerTech,
          message: 'No court decision found for specified documentNumber and source',
        });
        return;
      }

      if (!courtDecision.originalText || !courtDecision.labelTreatments || courtDecision.labelTreatments.length === 0) {
        logger.info({
          ...logerTech,
          message: 'Court decision must have an original text and labelTreatments, skipping.',
        });
        return;
      }

      logger.info({
        ...logerTech,
        message: `Court decision found. labelStatus: ${courtDecision.labelStatus}`,
      });
      const document = await connectorConfig.mapCourtDecisionToDocument(courtDecision, 'manual');

      logger.info({
        ...logerTech,
        message: 'Court decision converted. Inserting document into database...',
      });

      if (lowPriority) {
        await insertDocument({ ...document, route: 'exhaustive' }, settings);
      } else {
        await insertDocument({ ...document, route: 'request', priority: 4, status: 'toBeConfirmed' }, settings);
      }
      logger.info({
        ...logerTech,
        message: 'Insertion done',
      });

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

      // in case of high priority the document status is already set to toBeConfirmed and no preAssignation is possible
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
        ...logerTech,
        message: 'Selected document has been inserted in label database.',
      });
      await connectorConfig.updateDocumentLabelStatusToLoaded(document.externalId);
      logger.info({ ...logerTech, message: 'DONE' });
    } catch (error) {
      logger.error({
        ...logerTech,
        message: `${error}`,
      });
    }
  }

  async function importNewDocuments(settings: settingsType) {
    const logerDoc: TechLog = {
      operations: ['other', 'importNewDocuments'],
      path: 'src/backend/lib/connector/buildConnector.ts',
      message: 'importNewDocuments',
    };
    logger.info({
      ...logerDoc,
      message: `Starting importNewDocuments...`,
    });

    for (const source of Object.values(Deprecated.Sources)) {
      logger.info({
        ...logerDoc,
        message: `Fetching ${source} decisions...`,
      });
      const newDecisionForSource = await connectorConfig.fetchDecisionsToPseudonymise(source);
      logger.info({
        ...logerDoc,
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
          const converted = await connectorConfig.mapCourtDecisionToDocument(decision, 'recent');
          await insertDocument(converted, settings);

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
              documentId: converted._id,
              previousAnnotations: [],
              nextAnnotations: annotations,
              source: 'reimportedTreatment',
            },
            settings,
          );

          const routeForDocument = await extractRoute(converted);
          await updateDocumentRoute(converted._id, routeForDocument);

          const isPreassignated = await preAssignator.preAssignDocument({ ...converted, route: routeForDocument });
          // in case of preassignation lifecycle is manage by preAssignator
          if (!isPreassignated) {
            const nextStatus = getNextStatus({
              publicationCategory: converted.publicationCategory,
              status: converted.status,
              route: routeForDocument,
            });
            await updateDocumentStatus(converted._id, nextStatus);
          }

          await connectorConfig.updateDocumentLabelStatusToLoaded(converted.externalId);
        } catch (err) {
          console.log(err)
          logger.error({
            ...logerDoc,
            message: `${err}`,
          });
        }
      }
    }
  }
}

async function insertDocument(document: documentType, settings: settingsType) {
  const loggerDecision: DecisionLog = {
    operations: ['other', 'insertDocument'],
    path: 'src/backend/lib/connector/buildConnector.ts',
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
