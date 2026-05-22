import { settingsModule } from '@src/core';
import { buildRunServer } from '@src/backend/app/buildRunServer';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import yargs from 'yargs';

(async () => {
  const argv = yargs
    .options({
      settings: {
        alias: 's',
        demandOption: true,
        description: 'Settings of LABEL',
        type: 'string',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  const raw = await fs.readFile(resolve(argv.settings as string), { encoding: 'utf8' });
  const parsed = settingsModule.lib.parseFromJson(raw);
  const settings = settingsModule.lib.motivationCategoryHandler.addCategoryToSettings(
    settingsModule.lib.additionalAnnotationCategoryHandler.addCategoryToSettings(parsed),
  );

  const runServer = buildRunServer(settings);
  runServer();
})();
