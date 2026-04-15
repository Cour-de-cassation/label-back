import { preAssignationType } from '@src/core';
import { ObjectId } from 'mongodb';

export type { customPreAssignationRepositoryType };

type customPreAssignationRepositoryType = {
  findOneByNumberAndSource: ({
    number,
    source,
  }: {
    number: string;
    source: string;
  }) => Promise<preAssignationType | undefined>;
  deleteById: (id: ObjectId) => Promise<void>;
};
