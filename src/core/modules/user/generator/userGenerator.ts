import { generatorType } from '../../../types';
import { userType } from '../userType';
import { ObjectId } from 'mongodb';

export { userGenerator };

const userGenerator: generatorType<userType> = {
  generate: ({ email, _id, name, role } = {}) => ({
    email: email || 'EMAIL',
    _id: _id ? new ObjectId(_id) : new ObjectId(),
    name: name || 'NAME',
    role: role || 'annotator',
  }),
};
