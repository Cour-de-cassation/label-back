import { preAssignationModule } from '@src/core';
import { buildPreAssignationRepository } from '..';
import { ObjectId } from 'mongodb';

export { createPreAssignation };

async function createPreAssignation({ userId, source, number }: { userId: ObjectId; source: string; number: string }) {
  const preAssignationRepository = buildPreAssignationRepository();

  const preAssignation = preAssignationModule.lib.buildPreAssignation({
    userId,
    source,
    number,
    creationDate: new Date().getTime(),
  });

  await preAssignationRepository.insert(preAssignation);

  return preAssignation;
}
