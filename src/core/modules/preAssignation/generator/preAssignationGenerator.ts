import { generatorType } from '../../../types';
import { preAssignationType } from '../preAssignationType';
import { ObjectId } from 'mongodb';

export { preAssignationGenerator };

const preAssignationGenerator: generatorType<preAssignationType> = {
  generate: ({ _id, userId, number, source, creationDate } = {}) => ({
    _id: _id ? new ObjectId(_id) : new ObjectId(),
    userId: userId ? new ObjectId(userId) : new ObjectId(),
    number: number ?? Math.floor(Math.random() * 1000000).toString(),
    source: source ?? `SOURCE_${Math.random()}`,
    creationDate: creationDate ?? new Date().getTime(),
  }),
};
