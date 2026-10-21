import { Filter } from 'mongodb';
import { statisticType } from '@src/core';
import { mongo } from '../../utils';
import { buildProjection } from './projection';

const statistics = () => mongo.getDb().collection<statisticType>('statistics');

export async function insertStatistic(statistic: statisticType) {
  await statistics().insertOne(statistic);
}

export async function findStatistics(filter: Filter<statisticType> = {}) {
  return statistics().find(filter).toArray();
}

export async function findStatisticsProjection<K extends keyof statisticType>(
  filter: Filter<statisticType>,
  fields: K[],
) {
  return statistics()
    .find(filter)
    .project<Pick<statisticType, K | '_id'>>(buildProjection<statisticType>(fields))
    .toArray();
}

export async function deleteStatistics(filter: Filter<statisticType>) {
  const { deletedCount } = await statistics().deleteMany(filter);
  return deletedCount;
}

export async function unsetStatisticsTreatmentsSummaryUserId(filter: Filter<statisticType>) {
  const { modifiedCount } = await statistics().updateMany(filter, {
    $unset: { 'treatmentsSummary.$[].userId': '' },
  });
  return modifiedCount;
}

export async function findStatisticsExtremumTreatmentDate(sources: string[]) {
  const [min] = await statistics()
    .find({ source: { $in: sources } })
    .sort({ treatmentDate: 1 })
    .limit(1)
    .toArray();
  const [max] = await statistics()
    .find({ source: { $in: sources } })
    .sort({ treatmentDate: -1 })
    .limit(1)
    .toArray();
  return { minDate: min?.treatmentDate, maxDate: max?.treatmentDate };
}
