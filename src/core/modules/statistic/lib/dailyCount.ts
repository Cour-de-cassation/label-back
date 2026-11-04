import { statisticType } from '../statisticType';

export { dailyCount };

function dailyCount(statistics: statisticType[]) {
  const dailyCount: {
    [key: number]: { day: number; total: number };
  } = {};
  for (const statistic of statistics) {
    const day = new Date(statistic.treatmentDate).setHours(0, 0, 0, 0);
    if (!dailyCount[day]) {
      dailyCount[day] = { day, total: 0 };
    }
    dailyCount[day]['total']++;
  }
  return dailyCount;
}
