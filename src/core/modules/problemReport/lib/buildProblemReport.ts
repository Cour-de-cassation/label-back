import { problemReportType } from '../problemReportType';
import { ObjectId } from 'mongodb';

export { buildProblemReport };

function buildProblemReport(assignationFields: Omit<problemReportType, '_id'>): problemReportType {
  return {
    ...assignationFields,
    _id: new ObjectId(),
  };
}
