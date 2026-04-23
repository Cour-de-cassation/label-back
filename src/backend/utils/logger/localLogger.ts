export { localLogger };
import { TechLog, DecisionLog } from './loggerType';
import pino from 'pino';

const pinoPrettyConf = {
  target: 'pino-pretty',
  options: {
    singleLine: true,
    colorize: true,
    translateTime: 'UTC:dd-mm-yyyy - HH:MM:ss Z',
  },
};

const loggerOptions = {
  formatters: {
    level: (label: string) => {
      return {
        logLevel: label.toUpperCase(),
      };
    },
    log: (content: Record<string, any>) => ({
      ...content,
      type: Object.keys(content).includes('decison') ? 'decision' : 'tech',
      appName: 'label-back',
    }),
  },
  timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  redact: {
    paths: ['req', 'res', 'headers', 'ip', 'responseTime', 'hostname', 'pid', 'level'],
    censor: '',
    remove: true,
  },
  autoLogging: false,
  transport: process.env.NODE_ENV === 'development' ? pinoPrettyConf : undefined,
};

const pinoInstance = pino(loggerOptions);

const localLogger = {
  info(log: TechLog | DecisionLog) {
    pinoInstance.info(log);
  },
  warn(log: TechLog) {
    pinoInstance.warn(log);
  },
  error(log: TechLog & { stack?: string }) {
    pinoInstance.error(log);
  },
};
