import { assignationType } from '../assignationType';
import { ObjectId } from 'mongodb';

export { buildAssignation };

function buildAssignation(assignationFields: Omit<assignationType, '_id'>): assignationType {
  return {
    ...assignationFields,
    _id: new ObjectId(),
  };
}
