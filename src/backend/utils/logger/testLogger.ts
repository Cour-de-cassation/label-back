import { loggerType } from './loggerType';

export { testLogger };

const testLogger: loggerType = {
  async info() {
    return;
  },
  async error() {
    return;
  },
  async warn() {
    return;
  },
};
