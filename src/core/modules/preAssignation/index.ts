import { preAssignationType } from './preAssignationType';
import { preAssignationGenerator } from './generator';
import { buildPreAssignation } from './lib';

export { preAssignationModule };

export type { preAssignationType };

const preAssignationModule = {
  generator: preAssignationGenerator,
  lib: { buildPreAssignation },
};
