import { idType } from '../id';

export type userRoleType = 'admin' | 'annotator' | 'publicator' | 'scrutator';

export type userType = {
  _id: idType;
  email: string;
  name: string;
  role: userRoleType;
};
