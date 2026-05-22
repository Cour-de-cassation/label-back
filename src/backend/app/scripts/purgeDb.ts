import yargs from 'yargs';
import { withMongo } from './withMongo';
import { statisticService } from '../../modules/statistic';

export { purgeDb };

if (require.main === module) {
  (async () => {
    const { beforeMonths } = parseArgv();
    await withMongo(() => purgeDb({ months: beforeMonths }));
  })();
}

async function purgeDb({ months }: { months: number }) {
  await statisticService.deleteTreatmentsSummaryBefore({
    since: months,
    unit: 'MONTHS',
  });
}

function parseArgv() {
  const argv = yargs
    .options({
      beforeMonths: {
        demandOption: true,
        description: 'months before purging',
        type: 'number',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return { beforeMonths: argv.beforeMonths as number };
}
