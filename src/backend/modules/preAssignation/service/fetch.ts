import { preAssignationType } from '@src/core';
import { buildPreAssignationRepository } from '..';
import { userService } from '../../user';

export { fetchAllPreAssignation, fetchPreAssignationBySourceAndNumber };

async function fetchAllPreAssignation() {
  const preAssignationRepository = buildPreAssignationRepository();
  const preAssignations = await preAssignationRepository.findAll();

  const usersByIds = await userService.fetchUsersByIds(preAssignations.map(({ userId }) => userId));

  return preAssignations.map((preAssignation) => {
    const userIdString = preAssignation.userId.toHexString();
    return {
      preAssignation,
      userName: usersByIds[userIdString].name,
    };
  });
}

async function fetchPreAssignationBySourceAndNumber(
  number: string,
  source: string,
): Promise<preAssignationType | undefined> {
  const preAssignationRepository = buildPreAssignationRepository();
  return preAssignationRepository.findOneByNumberAndSource({
    number,
    source,
  });
}
