import { ressourceFilterType, statisticType } from '@src/core';
import { projectedType } from '../../../repository';
import { ObjectId } from 'mongodb';

export type { customStatisticRepositoryType };

type customStatisticRepositoryType = {
  findAllStatisticsByDocumentNumber: (documentNumber: statisticType['documentNumber']) => Promise<Array<statisticType>>;
  findAllByRessourceFilter: (ressourceFilter: ressourceFilterType) => Promise<Array<statisticType>>;
  findAllIdsBefore: (date: number) => Promise<Array<ObjectId>>;
  findExtremumTreatmentDateBySources: (
    sources: statisticType['source'][],
  ) => Promise<{ minDate: number | undefined; maxDate: number | undefined }>;
  deleteTreatmentsSummaryByIds: (ids: ObjectId[]) => Promise<number>;
  findRecentStatisticsProjection: <projectionT extends keyof statisticType>(
    projections: Array<projectionT>,
  ) => Promise<Array<projectedType<statisticType, projectionT>>>;
};
