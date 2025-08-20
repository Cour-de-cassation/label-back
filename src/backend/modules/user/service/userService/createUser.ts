import { userModule, userType } from '@src/core';
import { signUpUser } from './signUpUser';

export { createUser };

async function createUser({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: userType['role'];
}) {
  const password = userModule.lib.passwordHandler.generate();
  await signUpUser({ name, email, role, password });
  return password;
}
