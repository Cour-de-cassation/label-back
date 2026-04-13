import { dependencyManager } from '../dependencyManager';
import { localLogger } from './localLogger';
import { testLogger } from './testLogger';

export { injectedLogger as logger };

const injectedLogger = dependencyManager.inject({
  forProd: localLogger,
  forTest: testLogger,
});
