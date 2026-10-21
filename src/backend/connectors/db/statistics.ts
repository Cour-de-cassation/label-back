import { Filter, ObjectId } from 'mongodb';
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

/**
 * Statistics matching the filter, with the name and id of the user of each treatment summary.
 * Summaries whose user does not exist anymore are skipped; anonymized summaries (no userId) are kept without user.
 */
export async function findStatisticsWithUserNames(filter: Filter<statisticType>) {
  return statistics()
    .aggregate<
      Omit<statisticType, 'treatmentsSummary'> & {
        treatmentsSummary: Array<{ name?: string; id?: ObjectId; statId: ObjectId; treatmentDuration: number }>;
      }
    >([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'treatmentsSummary.userId',
          foreignField: '_id',
          as: 'summaryUsers',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $set: {
          treatmentsSummary: {
            $filter: {
              input: {
                $map: {
                  input: '$treatmentsSummary',
                  as: 'summary',
                  in: {
                    $let: {
                      vars: {
                        user: {
                          $first: {
                            $filter: {
                              input: '$summaryUsers',
                              as: 'user',
                              cond: { $eq: ['$$user._id', '$$summary.userId'] },
                            },
                          },
                        },
                      },
                      in: {
                        $cond: [
                          { $in: [{ $type: '$$summary.userId' }, ['missing', 'null']] },
                          { statId: '$_id', treatmentDuration: '$$summary.treatmentDuration' },
                          {
                            $cond: [
                              { $eq: [{ $type: '$$user' }, 'object'] },
                              {
                                name: '$$user.name',
                                id: '$$user._id',
                                statId: '$_id',
                                treatmentDuration: '$$summary.treatmentDuration',
                              },
                              null,
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
              },
              as: 'summary',
              cond: { $ne: ['$$summary', null] },
            },
          },
        },
      },
      { $unset: 'summaryUsers' },
    ])
    .toArray();
}
