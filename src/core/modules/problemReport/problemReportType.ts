import { ObjectId } from 'mongodb';

export type problemReportTypeEnum = 'bug' | 'annotationProblem' | 'suggestion';

export type problemReportType = {
  _id: ObjectId;
  documentId: ObjectId;
  userId: ObjectId;
  date: number;
  text: string;
  hasBeenRead: boolean;
  type: problemReportTypeEnum;
};
