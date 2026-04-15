import { problemReportGenerator } from './generator';
import { problemReportType } from './problemReportType';
import { buildProblemReport } from './lib';

export { problemReportModule };

export type { problemReportType };

const problemReportModule = {
  generator: problemReportGenerator,
  lib: { buildProblemReport },
};
