import { ressourceFilterGenerator } from './generator';
import { filterTreatedDocuments } from './lib';
import { ressourceFilterType } from './ressourceFilterType';

export { ressourceFilterModule };

export type { ressourceFilterType };

const ressourceFilterModule = {
  generator: ressourceFilterGenerator,
  lib: { filterTreatedDocuments },
};
