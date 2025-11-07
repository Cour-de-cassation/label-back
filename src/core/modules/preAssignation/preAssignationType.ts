import { ObjectId } from 'mongodb';

export type preAssignationType = {
  _id: ObjectId;
  userId: ObjectId;
  number: string;
  source: string;
  creationDate: number;
};
