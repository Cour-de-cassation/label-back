import { clearDb } from './backend/app/scripts';

global.beforeEach(async () => {
  await clearDb({});
});
