import { ObjectId } from 'mongodb';

export type userRoleType = 'admin' | 'annotator' | 'publicator' | 'scrutator';

export type userType = {
  _id: ObjectId;
  email: string;
  name: string;
  role: userRoleType;
};
