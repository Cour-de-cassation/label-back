import { ObjectId } from 'mongodb';

export type cacheType = {
  _id: ObjectId;
  key: string;
  updateDate: number;
  content: string;
};
