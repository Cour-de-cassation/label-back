import { dependencyManager } from '../../../utils';
import { buildFakeUserRepository } from './buildFakeUserRepository';
import { buildUserRepository } from './buildUserRepository';

export { buildRepository as buildUserRepository };

const buildRepository = dependencyManager.inject({
  forProd: buildUserRepository,
  forTest: buildFakeUserRepository,
});
