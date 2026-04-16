export { localLogger };
import { TechLog, DecisionLog } from './loggerType';

const localLogger = {
  info(log: TechLog | DecisionLog) {
    console.log({
      level: 'info',
      operations: log.operations,
      path: log.path,
      message: log.message ?? '',
      decision: 'decision' in log ? { decision: log.decision } : undefined,
    });
  },
  warn(log: TechLog) {
    console.warn({
      level: 'warn',
      operations: log.operations,
      path: log.path,
      message: log.message ?? '',
    });
  },
  error(log: TechLog & { stack?: string }) {
    console.error({
      level: 'error',
      operations: log.operations,
      path: log.path,
      message: log.message ?? '',
      stack: log.stack ? { stack: log.stack } : undefined,
    });
  },
};
