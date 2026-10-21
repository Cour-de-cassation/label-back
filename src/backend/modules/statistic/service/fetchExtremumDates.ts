import { findStatisticsExtremumTreatmentDate } from '../../../connectors/db/statistics';
import { findTreatmentsExtremumLastUpdateDate } from '../../../connectors/db/treatments';

export { fetchExtremumDates };

async function fetchExtremumDates(sources: string[]) {
  const extremumDatesInStatistics = await findStatisticsExtremumTreatmentDate(sources);

  const extremumDatesInTreatments = await findTreatmentsExtremumLastUpdateDate(['annotator', 'admin']);

  let minDate,
    maxDate = undefined;
  if (extremumDatesInStatistics.minDate !== undefined && extremumDatesInTreatments.minDate !== undefined) {
    minDate = Math.min(extremumDatesInStatistics.minDate, extremumDatesInTreatments.minDate);
  } else if (extremumDatesInStatistics.minDate === undefined && extremumDatesInTreatments.minDate !== undefined) {
    minDate = extremumDatesInTreatments.minDate;
  } else if (extremumDatesInStatistics.minDate !== undefined && extremumDatesInTreatments.minDate === undefined) {
    minDate = extremumDatesInStatistics.minDate;
  }

  if (extremumDatesInStatistics.maxDate !== undefined && extremumDatesInTreatments.maxDate !== undefined) {
    maxDate = Math.max(extremumDatesInStatistics.maxDate, extremumDatesInTreatments.maxDate);
  } else if (extremumDatesInStatistics.maxDate === undefined && extremumDatesInTreatments.maxDate !== undefined) {
    maxDate = extremumDatesInTreatments.maxDate;
  } else if (extremumDatesInStatistics.maxDate !== undefined && extremumDatesInTreatments.maxDate === undefined) {
    maxDate = extremumDatesInStatistics.maxDate;
  }

  return {
    minDate,
    maxDate,
  };
}
