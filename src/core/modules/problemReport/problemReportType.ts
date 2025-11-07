import { idType } from '../id';

export type problemReportTypeEnum = 'bug' | 'annotationProblem' | 'suggestion';

export type problemReportType = {
  _id: idType;
  documentId: idType;
  userId: idType;
  date: number;
  text: string;
  hasBeenRead: boolean;
  type: problemReportTypeEnum;
};
