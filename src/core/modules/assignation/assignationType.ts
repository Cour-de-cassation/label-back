import { ObjectId } from 'mongodb';

export type assignationType = {
  _id: ObjectId;
  documentId: ObjectId;
  treatmentId: ObjectId;
  userId: ObjectId;
  assignationDate: number;
};
