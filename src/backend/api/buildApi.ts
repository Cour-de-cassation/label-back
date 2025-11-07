import { Express, Request, Response, NextFunction } from 'express';
import { mapValues } from 'lodash';
import { idModule, replacementTermType, userType } from '@src/core';
import { logger } from '../utils';
import { ssoService } from '../modules/sso';
import { settingsLoader } from '../lib/settingsLoader';
import { assignationService } from '../modules/assignation';
import { cacheService } from '../modules/cache';
import { documentService } from '../modules/document';
import { problemReportService } from '../modules/problemReport';
import { statisticService } from '../modules/statistic';
import { treatmentService } from '../modules/treatment';
import { userService } from '../modules/user';
import { preAssignationService } from '../modules/preAssignation';
import { userModule } from '@src/core';

export { buildApi };

const API_BASE_URL = '/label/api';

function buildApi(app: Express) {
  // =============================================================================
  // GET ENDPOINTS
  // =============================================================================

  app.get(
    `${API_BASE_URL}/aggregatedStatistics`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const { ressourceFilter } = req.query as any;
      const settings = settingsLoader.getSettings();

      const result = await statisticService.fetchAggregatedStatisticsAccordingToFilter(
        {
          ...ressourceFilter,
          userId: ressourceFilter.userId !== undefined ? idModule.lib.buildId(ressourceFilter.userId) : undefined,
        },
        settings,
      );
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/documentStatistics`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const { documentNumber } = req.query as any;
      const result = await statisticService.fetchDocumentStatistics(documentNumber);
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/annotationsDiffDetails`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const { documentId } = req.query as any;
      const result = await treatmentService.fetchAnnotationsDiffDetailsForDocument(idModule.lib.buildId(documentId));
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/annotations`,
    withAuth(['admin', 'annotator', 'scrutator'], async (user, req, res) => {
      const { documentId } = req.query as any;
      const result = await treatmentService.fetchAnnotationsOfDocument(idModule.lib.buildId(documentId));
      res.status(200).json(result);
    }),
  );

  app.get(`${API_BASE_URL}/anonymizedDocumentText`, async (req, res, next) => {
    try {
      const { documentId } = parseQuery(req.query);
      const result = await documentService.fetchAnonymizedDocumentText(idModule.lib.buildId(documentId));
      res.status(200).json(result);
    } catch (error) {
      handleError(error, res, next);
    }
  });

  app.get(
    `${API_BASE_URL}/availableStatisticFilters`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const cache = (await cacheService.fetchAllByKey('availableStatisticFilters'))[0];
      if (cache) {
        res.status(200).json(JSON.parse(cache.content));
      } else {
        res.status(200).json({
          publicationCategories: [],
          maxDate: undefined,
          minDate: undefined,
          routes: [],
          importers: [],
          sources: [],
          jurisdictions: [],
        });
      }
    }),
  );

  app.get(
    `${API_BASE_URL}/document`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const { documentId } = req.query as any;
      if (user.role === 'admin') {
        await documentService.updateDocumentReviewStatus(idModule.lib.buildId(documentId), {
          viewerNameToAdd: user.name,
        });
      }
      const result = await documentService.fetchDocument(idModule.lib.buildId(documentId));
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/documentStatus`,
    withAuth(['admin', 'annotator', 'publicator'], async (user, req, res) => {
      const { documentId } = req.query as any;
      const document = await documentService.fetchDocument(idModule.lib.buildId(documentId));
      res.status(200).json(document.status);
    }),
  );

  app.get(
    `${API_BASE_URL}/documentsForUser`,
    withAuth(['admin', 'annotator'], async (user, req, res) => {
      const { documentsMaxCount } = req.query as any;
      const result = await documentService.fetchDocumentsForUser(idModule.lib.buildId(user._id), documentsMaxCount);
      res.status(200).json(result);
    }),
  );

  app.get(`${API_BASE_URL}/health`, async (req, res, next) => {
    try {
      await userService.fetchUsers();
      res.status(200).json(true);
    } catch (error) {
      handleError(error, res, next);
    }
  });

  app.get(
    `${API_BASE_URL}/problemReportsWithDetails`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const result = await problemReportService.fetchProblemReportsWithDetails();
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/settings`,
    withAuth(['admin', 'annotator', 'scrutator'], async (user, req, res) => {
      res.status(200).json({
        json: JSON.stringify(settingsLoader.getSettings()),
      });
    }),
  );

  app.get(
    `${API_BASE_URL}/summary`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const result = await statisticService.fetchSummary();
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/personalStatistics`,
    withAuth(['admin', 'annotator', 'scrutator'], async (user, req, res) => {
      const settings = settingsLoader.getSettings();
      const result = await statisticService.fetchPersonalStatistics(user, settings);
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/publishableDocuments`,
    withAuth(['admin', 'publicator'], async (user, req, res) => {
      const result = await documentService.fetchPublishableDocuments();
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/toBeConfirmedDocuments`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const result = await documentService.fetchToBeConfirmedDocuments();
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/treatedDocuments`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const settings = settingsLoader.getSettings();
      const result = await documentService.fetchTreatedDocuments(settings);
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/untreatedDocuments`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const result = await documentService.fetchUntreatedDocuments();
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/mandatoryReplacementTerms`,
    withAuth(['admin', 'annotator', 'scrutator'], async (user, req, res) => {
      const result: replacementTermType[] = []; // TO DO
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/workingUsers`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const result = await userService.fetchWorkingUsers();
      res.status(200).json(result);
    }),
  );

  app.get(
    `${API_BASE_URL}/preAssignations`,
    withAuth(['admin', 'scrutator'], async (user, req, res) => {
      const result = await preAssignationService.fetchAllPreAssignation();
      res.status(200).json(result);
    }),
  );

  // =============================================================================
  // POST ENDPOINTS
  // =============================================================================

  app.post(
    `${API_BASE_URL}/assignDocumentToUser`,
    withAuth(['admin'], async (user, req, res) => {
      const { documentId, userId } = req.body;
      await documentService.assertDocumentStatus({
        documentId: idModule.lib.buildId(documentId),
        status: 'free',
      });
      await assignationService.createAssignation({
        documentId: idModule.lib.buildId(documentId),
        userId: idModule.lib.buildId(userId),
      });
      const result = await documentService.updateDocumentStatus(idModule.lib.buildId(documentId), 'saved');
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/createUser`,
    withAuth(['admin'], async (user, req, res) => {
      const { name, email, role } = req.body;
      const result = await userService.createUser({ name, email, role });
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/deleteProblemReport`,
    withAuth(['admin'], async (user, req, res) => {
      const { problemReportId } = req.body;
      await problemReportService.deleteProblemReportById(idModule.lib.buildId(problemReportId));
      res.status(201).send();
    }),
  );

  app.post(
    `${API_BASE_URL}/deletePreAssignation`,
    withAuth(['admin'], async (user, req, res) => {
      const { preAssignationId } = req.body;
      await preAssignationService.deletePreAssignation(idModule.lib.buildId(preAssignationId));
      res.status(201).send();
    }),
  );

  app.post(
    `${API_BASE_URL}/deleteHumanTreatmentsForDocument`,
    withAuth(['admin'], async (user, req, res) => {
      const { documentId } = req.body;
      await assignationService.deleteAssignationsByDocumentId(idModule.lib.buildId(documentId));
      await documentService.updateDocumentStatus(idModule.lib.buildId(documentId), 'free');
      await documentService.resetDocumentReviewStatus(idModule.lib.buildId(documentId));
      res.status(201).send();
    }),
  );

  app.post(
    `${API_BASE_URL}/problemReport`,
    withAuth(['admin', 'annotator', 'scrutator'], async (user, req, res) => {
      const { documentId, problemText, problemType } = req.body;
      await problemReportService.createProblemReport({
        userId: idModule.lib.buildId(user._id),
        documentId: idModule.lib.buildId(documentId),
        problemText,
        problemType,
      });
      res.status(201).send();
    }),
  );

  app.post(
    `${API_BASE_URL}/deleteDocument`,
    withAuth(['admin'], async (user, req, res) => {
      const { documentId } = req.body;
      const documentToDelete = await documentService.fetchDocument(idModule.lib.buildId(documentId));
      const settings = settingsLoader.getSettings();
      await statisticService.saveStatisticsOfDocument(documentToDelete, settings, 'deleted from the interface');
      await documentService.deleteDocument(idModule.lib.buildId(documentId));
      res.status(201).send();
    }),
  );

  app.post(
    `${API_BASE_URL}/resetTreatmentLastUpdateDate`,
    withAuth(['admin', 'annotator'], async (user, req, res) => {
      const { assignationId } = req.body;
      const assignation = await assignationService.fetchAssignation(idModule.lib.buildId(assignationId));

      if (!idModule.lib.equalId(idModule.lib.buildId(user._id), assignation.userId)) {
        throw new Error(
          `User ${idModule.lib.convertToString(user._id)} is trying to update a treatment that is not assigned to him/her`,
        );
      }

      const result = await treatmentService.resetTreatmentLastUpdateDate(assignation.treatmentId);
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updateAssignationDocumentStatus`,
    withAuth(['admin'], async (user, req, res) => {
      const { assignationId, status } = req.body;
      const result = await assignationService.updateAssignationDocumentStatus(
        idModule.lib.buildId(assignationId),
        status,
      );
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updateDocumentStatus`,
    withAuth(['admin', 'annotator', 'publicator'], async (user, req, res) => {
      const { documentId, status } = req.body;
      if (user.role !== 'admin' && user.role !== 'publicator') {
        await assignationService.assertDocumentIsAssignatedToUser({
          documentId: idModule.lib.buildId(documentId),
          userId: idModule.lib.buildId(user._id),
        });
      }
      const result = await documentService.updateDocumentStatus(idModule.lib.buildId(documentId), status);
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updateDocumentRoute`,
    withAuth(['admin'], async (user, req, res) => {
      const { documentId, route } = req.body;
      const result = await documentService.updateDocumentRoute(idModule.lib.buildId(documentId), route);
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updatePublishableDocumentStatus`,
    withAuth(['admin', 'publicator'], async (user, req, res) => {
      const { documentId, status } = req.body;
      await documentService.assertDocumentIsPublishable(idModule.lib.buildId(documentId));
      const result = await documentService.updateDocumentStatus(idModule.lib.buildId(documentId), status);
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updateProblemReportHasBeenRead`,
    withAuth(['admin'], async (user, req, res) => {
      const { problemReportId, hasBeenRead } = req.body;
      await problemReportService.updateHasBeenRead(idModule.lib.buildId(problemReportId), hasBeenRead);
      res.status(201).send();
    }),
  );

  app.post(
    `${API_BASE_URL}/updateTreatmentDuration`,
    withAuth(['admin', 'annotator'], async (user, req, res) => {
      const { assignationId } = req.body;
      const assignation = await assignationService.fetchAssignation(idModule.lib.buildId(assignationId));

      if (!idModule.lib.equalId(idModule.lib.buildId(user._id), assignation.userId)) {
        throw new Error(
          `User ${idModule.lib.convertToString(user._id)} is trying to update a treatment that is not assigned to him/her`,
        );
      }

      const result = await treatmentService.updateTreatmentDuration(assignation.treatmentId);
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updateTreatmentForAssignationId`,
    withAuth(['admin', 'annotator'], async (user, req, res) => {
      const { annotationsDiff, assignationId } = req.body;
      const assignation = await assignationService.fetchAssignation(idModule.lib.buildId(assignationId));

      if (!idModule.lib.equalId(idModule.lib.buildId(user._id), assignation.userId)) {
        throw new Error(
          `User ${idModule.lib.convertToString(user._id)} is trying to update a treatment that is not assigned to him/her`,
        );
      }

      const settings = settingsLoader.getSettings();
      const result = await treatmentService.updateTreatment({
        annotationsDiff,
        assignation,
        settings,
      });
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/updateTreatmentForDocumentId`,
    withAuth(['admin'], async (user, req, res) => {
      const { annotationsDiff, documentId } = req.body;
      const settings = settingsLoader.getSettings();
      const result = await treatmentService.updateTreatmentForDocumentIdAndUserId(
        {
          annotationsDiff,
          documentId: idModule.lib.buildId(documentId),
          userId: idModule.lib.buildId(user._id),
        },
        settings,
      );
      res.status(201).json(result);
    }),
  );

  app.post(
    `${API_BASE_URL}/createPreAssignation`,
    withAuth(['admin'], async (user, req, res) => {
      const { userId, source, number } = req.body;
      await preAssignationService.createPreAssignation({
        userId: idModule.lib.buildId(userId),
        source,
        number,
      });
      res.status(201).send();
    }),
  );

  // =============================================================================
  // SSO ENDPOINTS
  // =============================================================================

  app.get(`${API_BASE_URL}/sso/metadata`, async (req, res) => {
    try {
      const xml = await ssoService.getMetadata();
      res.type('application/xml').send(xml);
    } catch (err) {
      res.status(500).send(`Metadata SAML protocol error ${err}`);
    }
  });

  app.get(`${API_BASE_URL}/sso/login`, async (req, res) => {
    try {
      const context = await ssoService.login();
      res.redirect(context);
    } catch (err) {
      logger.error({
        operationName: 'login SSO ',
        msg: `${err}`,
      });
      res.status(401).json({
        status: 401,
        message: err instanceof Error ? err.message : `${err}`,
      });
    }
  });

  app.get(`${API_BASE_URL}/sso/logout`, (req, res) => {
    const nameID = String(req.session.user?.email);
    const sessionIndex = String(req.session.user?.sessionIndex);
    req.session.destroy(async (err) => {
      if (err) {
        res.status(500);
      }
      try {
        const context = await ssoService.logout({ nameID, sessionIndex });
        res.redirect(context);
      } catch (err) {
        logger.error({
          operationName: 'logoutSso',
          msg: `${err}`,
        });
        res.status(500).json({
          status: 500,
          message: err instanceof Error ? err.message : `${err}`,
        });
      }
    });
  });

  app.get(`${API_BASE_URL}/sso/whoami`, (req, res) => {
    const user = req.session?.user ?? null;
    if (!user) {
      return res.status(401).send({ status: 401, message: `Session invalid or expired` });
    }
    res.type('application/json').send(user);
  });

  app.post(`${API_BASE_URL}/sso/acs`, async (req, res) => {
    try {
      const url = await ssoService.acs(req);
      res.redirect(url);
    } catch (err) {
      res.status(500);
      res.redirect(`${API_BASE_URL}/sso/logout`);
    }
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Authentication middleware wrapper
 * Checks user session and permissions before executing the handler
 */
function withAuth(
  permissions: Array<userType['role']>,
  handler: (user: userType, req: Request, res: Response) => Promise<void>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check user session
      const currentUser = req.session?.user ?? null;
      if (!currentUser) {
        throw new Error(`user session has expired or is invalid`);
      }

      // Build user object
      const resolvedUser: userType = {
        _id: idModule.lib.buildId(currentUser._id) as userType['_id'],
        name: currentUser.name,
        role: currentUser.role as 'admin' | 'annotator' | 'publicator' | 'scrutator',
        email: currentUser.email,
      };

      // Check permissions
      userModule.lib.assertPermissions(resolvedUser, permissions);

      // Parse query parameters for GET requests (create a new parsed query object)
      if (req.method === 'GET' && Object.keys(req.query).length > 0) {
        const parsedQuery = parseQuery(req.query);
        // Override the query getter temporarily with parsed values
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: false,
          configurable: true,
        });
      }

      // Execute handler
      await handler(resolvedUser, req, res);
    } catch (error) {
      handleError(error, res, next);
    }
  };
}

/**
 * Parse query parameters (converts JSON strings to objects)
 */
function parseQuery(query: any): any {
  return mapValues(query, (queryValue) => {
    try {
      return JSON.parse(queryValue);
    } catch {
      return queryValue;
    }
  });
}

/**
 * Centralized error handler
 */
function handleError(error: any, res: Response, next: NextFunction) {
  logger.error({ operationName: 'apiError', msg: `${error}` });
  res.status(error.statusCode || 500);
  next(error);
}
