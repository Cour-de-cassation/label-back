import { logger, mongo } from '../utils';
import { setupMongo } from './setup';

export { buildRunScript };

function buildRunScript(): (
  script: () => Promise<void>,
  { shouldLoadDb }: { shouldLoadDb: boolean; shouldExit?: boolean },
) => Promise<void> {
  return async (script, { shouldLoadDb, shouldExit = true }) => {
    if (shouldLoadDb) {
      await runScriptWithDb();
    } else {
      await script();
    }

    if (shouldExit) {
      process.exit(0);
    }

    async function runScriptWithDb() {
      await setupMongo();

      await script();

      logger.info({
        operations: ['other', 'buildRunScript.runScriptWithDb'],
        path: './src/backend/app/buildRunScript.ts',
        message: `Closing connection with MongoDb...`,
      });
      await mongo.close();
      logger.info({
        operations: ['other', 'buildRunScript.runScriptWithDb'],
        path: './src/backend/app/buildRunScript.ts',
        message: `MongoDb connection closed!`,
      });
    }
  };
}
