import { idType } from '../id';

export type cacheType = {
  _id: idType;
  key: string;
  updateDate: number;
  content: string;
};
