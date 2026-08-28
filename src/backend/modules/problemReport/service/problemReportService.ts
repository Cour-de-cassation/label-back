import { documentType, problemReportModule, problemReportType } from '@src/core';
import { documentService } from '../../document';
import { userService } from '../../user';
import { buildProblemReportRepository } from '../repository';
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
      const problemReportRepository = buildProblemReportRepository();

      const documents = await documentService.fetchAllDocumentsByIds([documentId]);
      const users = await userService.fetchUsersByIds([userId]);

      await problemReportRepository.insert(
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
      throw new Error('Error while creating problem report');
    }
  },

  async deleteProblemReportById(problemReportId: problemReportType['_id']) {
    const problemReportRepository = buildProblemReportRepository();
    await problemReportRepository.deleteById(problemReportId);
  },

  async deleteProblemReportsByDocumentId(documentId: documentType['_id']) {
    const problemReportRepository = buildProblemReportRepository();
    await problemReportRepository.deleteByDocumentId(documentId);
  },

  async fetchProblemReportsWithDetails() {
    const problemReportRepository = buildProblemReportRepository();
    const problemReports = await problemReportRepository.findAll();

    const documentsById = await documentService.fetchAllDocumentsByIds(
      problemReports.map(({ documentId }) => documentId),
    );

    const usersByIds = await userService.fetchUsersByIds(problemReports.map(({ userId }) => userId));

    return problemReports.map((problemReport) => {
      const userIdString = problemReport.userId.toHexString();
      const { email, name } = usersByIds[userIdString];
      let documentToReturn = undefined;
      try {
        const document = documentsById[problemReport.documentId.toHexString()];
        documentToReturn = {
          _id: document._id,
          documentNumber: document.documentNumber,
          source: document.source,
          jurisdiction: document.decisionMetadata.jurisdiction,
          appealNumber: document.decisionMetadata.appealNumber,
          publicationCategory: document.publicationCategory,
          route: document.route,
          status: document.status,
        };
      } catch (e) {}

      return {
        problemReport,
        user: {
          email,
          name,
        },
        document: documentToReturn,
      };
    });
  },

  async updateHasBeenRead(problemReportId: problemReportType['_id'], hasBeenRead: problemReportType['hasBeenRead']) {
    const problemReportRepository = buildProblemReportRepository();
    return problemReportRepository.updateOne(problemReportId, { hasBeenRead });
  },

  async countUnreadProblemReports() {
    const problemReportRepository = buildProblemReportRepository();
    return problemReportRepository.countUnread();
  },
};
