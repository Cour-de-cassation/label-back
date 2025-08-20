import { idType, preAssignationType } from '@src/core';

export type { customPreAssignationRepositoryType };

type customPreAssignationRepositoryType = {
  findOneByNumberAndSource: ({
    number,
    source,
  }: {
    number: string;
    source: string;
  }) => Promise<preAssignationType | undefined>;
  deleteById: (id: idType) => Promise<void>;
};
