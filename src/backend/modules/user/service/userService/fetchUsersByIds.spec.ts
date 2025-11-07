import { userModule } from '@src/core';
import { buildUserRepository } from '../../repository';
import { buildUserService } from './index';

describe('fetchUsersByIds', () => {
  it('should return userNames mapped by userId', async () => {
    const userService = buildUserService();

    const userRepository = buildUserRepository();
    const [user1, user2] = ['Nicolas', 'Benoit'].map((name) => userModule.generator.generate({ name }));
    await userRepository.insert(user1);
    await userRepository.insert(user2);

    const userNamesByUsersId = await userService.fetchUsersByIds([user1._id, user2._id]);
    expect(userNamesByUsersId[user1._id.toHexString()].name).toEqual('Nicolas');
    expect(userNamesByUsersId[user2._id.toHexString()].name).toEqual('Benoit');
  });
});
