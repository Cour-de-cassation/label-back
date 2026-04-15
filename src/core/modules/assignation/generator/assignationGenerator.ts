import { generatorType } from '../../../types';
import { assignationType } from '../assignationType';
import { ObjectId } from 'mongodb';

export { assignationGenerator };

const assignationGenerator: generatorType<assignationType> = {
  generate: ({ documentId, _id, treatmentId, userId, assignationDate } = {}) => ({
    documentId: documentId ? new ObjectId(documentId) : new ObjectId(),
    _id: _id ? new ObjectId(_id) : new ObjectId(),
    treatmentId: treatmentId ? new ObjectId(treatmentId) : new ObjectId(),
    userId: userId ? new ObjectId(userId) : new ObjectId(),
    assignationDate: assignationDate ?? new Date().getTime(),
  }),
};
