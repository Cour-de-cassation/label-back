import { isTest } from '../env';
import { localLogger } from './localLogger';
import { testLogger } from './testLogger';

export { injectedLogger as logger };

const injectedLogger = isTest ? testLogger : localLogger;
