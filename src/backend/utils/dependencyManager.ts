import { buildDependencyManager } from '@src/core';

export { dependencyManager };

const { dependencyManager } = buildDependencyManager(process.env.RUN_MODE);
