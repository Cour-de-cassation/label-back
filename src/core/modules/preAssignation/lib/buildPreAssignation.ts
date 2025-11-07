import { preAssignationType } from '../preAssignationType';
import { ObjectId } from 'mongodb';

export { buildPreAssignation };

function buildPreAssignation(preAssignationFields: Omit<preAssignationType, '_id'>): preAssignationType {
  return {
    ...preAssignationFields,
    _id: new ObjectId(),
  };
}
