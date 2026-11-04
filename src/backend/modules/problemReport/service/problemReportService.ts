import { documentType, problemReportModule, problemReportType } from '@src/core';
import { documentService } from '../../document';
import { userService } from '../../user';
import {
  countProblemReports,
  deleteProblemReportById,
  deleteProblemReports,
  findProblemReportsWithDetails,
  insertProblemReport,
  updateProblemReportById,
} from '../../../connectors/db/problemReports';
import { logger } from '../../../utils';
import { ObjectId } from 'mongodb';

export { problemReportService };

const problemReportService = {
  async createProblemReport({
    userId,
    documentId,
    problemText,
    problemType,
  }: {
    userId: ObjectId;
    documentId: ObjectId;
    problemText: string;
    problemType: problemReportType['type'];
  }) {
    try {
      const documents = await documentService.fetchAllDocumentsByIds([documentId]);
      const users = await userService.fetchUsersByIds([userId]);

      await insertProblemReport(
        problemReportModule.lib.buildProblemReport({
          userId,
          documentId,
          date: new Date().getTime(),
          hasBeenRead: false,
          text: problemText,
          type: problemType,
        }),
      );

      const document = documents[documentId.toHexString()];
      const user = users[userId.toHexString()];

      if (document && user) {
        logger.info({
          operations: ['other', 'createProblemReport'],
          path: 'src/backend/modules/problemReport/service/problemReportService.ts',
          message: `Problem report created on document ${document.source}:${document.documentNumber} by ${user.name} - ${JSON.stringify(
            {
              userId: userId,
              userName: user.name,
            },
          )}`,
          decision: {
            sourceId: document.documentNumber.toString(),
            sourceName: document.source,
          },
        });
      }
    } catch (error) {
      throw new Error(`Error while creating problem report : ${error}`);
    }
  },

  async deleteProblemReportById(problemReportId: problemReportType['_id']) {
    await deleteProblemReportById(problemReportId);
  },

  async deleteProblemReportsByDocumentId(documentId: documentType['_id']) {
    await deleteProblemReports({ documentId });
  },

  fetchProblemReportsWithDetails: findProblemReportsWithDetails,

  async updateHasBeenRead(problemReportId: problemReportType['_id'], hasBeenRead: problemReportType['hasBeenRead']) {
    await updateProblemReportById(problemReportId, { hasBeenRead });
  },

  async countUnreadProblemReports() {
    return countProblemReports({ hasBeenRead: false });
  },
};
