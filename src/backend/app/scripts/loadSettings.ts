import { settingsModule, settingsType } from '@src/core';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import yargs from 'yargs';

export { loadSettings, loadSettingsFromPath };

async function loadSettings(): Promise<settingsType> {
  const argv = yargs
    .options({
      settings: {
        alias: 's',
        demandOption: true,
        description: 'Path to settings.json',
        type: 'string',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return loadSettingsFromPath(argv.settings as string);
}

async function loadSettingsFromPath(settingsFile: string): Promise<settingsType> {
  const raw = await fs.readFile(resolve(settingsFile), { encoding: 'utf8' });
  const parsed = settingsModule.lib.parseFromJson(raw);
  return settingsModule.lib.motivationCategoryHandler.addCategoryToSettings(
    settingsModule.lib.additionalAnnotationCategoryHandler.addCategoryToSettings(parsed),
  );
}
