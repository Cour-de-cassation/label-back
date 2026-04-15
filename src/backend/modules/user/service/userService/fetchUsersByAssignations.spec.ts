import { assignationModule, userModule } from '@src/core';
import { assignationService, buildAssignationRepository } from '../../../assignation';
import { buildUserRepository } from '../../repository';
import { buildUserService } from './index';

describe('fetchUsersByAssignations', () => {
  it('should return userNames mapped by assignationId', async () => {
    const userService = buildUserService();

    const assignationRepository = buildAssignationRepository();
    const userRepository = buildUserRepository();
    const [user1, user2] = ['Nicolas', 'Benoit'].map((name) => userModule.generator.generate({ name }));
    const [assignation1, assignation2] = [user1, user2].map((user) =>
      assignationModule.generator.generate({ userId: user._id }),
    );
    await userRepository.insert(user1);
    await userRepository.insert(user2);
    await assignationRepository.insert(assignation1);
    await assignationRepository.insert(assignation2);
    const assignationsById = await assignationService.fetchAllAssignationsById();

    const userNamesByAssignationId = await userService.fetchUsersByAssignations(Object.values(assignationsById));
    expect(userNamesByAssignationId[assignation1._id.toHexString()].name).toEqual('Nicolas');
    expect(userNamesByAssignationId[assignation2._id.toHexString()].name).toEqual('Benoit');
  });
});
