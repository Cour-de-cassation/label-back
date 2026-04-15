import { documentType } from '../documentType';
import { ObjectId } from 'mongodb';

export { buildDocument };

function buildDocument(
  documentFields: Omit<Omit<documentType, '_id'>, 'status' | 'updateDate' | 'reviewStatus'>,
): documentType {
  return {
    ...documentFields,
    _id: new ObjectId(),
    reviewStatus: { hasBeenAmended: false, viewerNames: [] },
    status: 'loaded',
    updateDate: new Date().getTime(),
  };
}
