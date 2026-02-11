import { userModule, userType } from '@src/core';
import { userRepository } from '../../repository/userRepository';

const DEFAULT_ROLE = 'annotator';

export { signUpUser };

async function signUpUser({
  email,
  name,
  role = DEFAULT_ROLE,
}: {
  email: string;
  name: string;
  role?: userType['role'];
}) {
  const repo = userRepository();
  const newUser = await userModule.lib.buildUser({
    email,
    name,
    role,
  });

  return repo.insert(newUser);
}
