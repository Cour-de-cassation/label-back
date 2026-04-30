import { buildDependencyManager } from '@src/core';
import { isTest, ENV } from './env';

export { dependencyManager };

const { dependencyManager } = buildDependencyManager(isTest ? 'TEST' : ENV);
