import { statisticGenerator } from './generator';
import { aggregate, buildStatistic, dailyCount } from './lib';
import { statisticType } from './statisticType';

export { statisticModule };

export type { statisticType };

const statisticModule = {
  generator: statisticGenerator,
  lib: { aggregate, buildStatistic, dailyCount },
};
