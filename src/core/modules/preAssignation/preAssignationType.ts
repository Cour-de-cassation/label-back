import { idType } from '../id';

export type preAssignationType = {
  _id: idType;
  userId: idType;
  number: string;
  source: string;
  creationDate: number;
};
