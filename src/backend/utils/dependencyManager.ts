import { buildDependencyManager } from '@src/core';
import { NODE_ENV } from './env';

export { dependencyManager };

const { dependencyManager } = buildDependencyManager(NODE_ENV);
