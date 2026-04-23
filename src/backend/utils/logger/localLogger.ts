export { localLogger };
import { logger } from '.';
import { TechLog, DecisionLog } from './loggerType';

const localLogger = {
  info(log: TechLog | DecisionLog) {
    logger.info(log);
  },
  warn(log: TechLog) {
    logger.warn(log);
  },
  error(log: TechLog & { stack?: string }) {
    logger.error(log);
  },
};
