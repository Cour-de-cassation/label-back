import { userType } from '../userType';
import { ObjectId } from 'mongodb';

export { buildUser };

async function buildUser({
  email,
  name,
  role,
}: {
  email: string;
  name: string;
  role: userType['role'];
}): Promise<userType> {
  return {
    _id: new ObjectId(),
    email: email.trim().toLowerCase(),
    name,
    role,
  };
}
