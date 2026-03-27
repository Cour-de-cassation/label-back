import yargs from 'yargs';
import { buildBackend } from '@src/backend';
import { parametersHandler } from '../lib/parametersHandler';
(async () => {
  const { settings } = await parametersHandler.getParameters();
  const { source } = parseArgv();
  const backend = buildBackend(settings);

  backend.runScript(
    () => backend.scripts.deleteDocumentsBySource.run(source, settings),
    backend.scripts.deleteDocumentsBySource.option,
  );
})();

function parseArgv() {
  const argv = yargs
    .options({
      source: {
        demandOption: true,
        description: 'source of the documents you want to delete',
        type: 'string',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return { source: argv.source as string };
}
