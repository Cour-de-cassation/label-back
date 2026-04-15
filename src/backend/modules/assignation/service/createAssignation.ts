import { assignationModule } from '@src/core';
import { treatmentService } from '../../treatment';
import { userService } from '../../user';
import { buildAssignationRepository } from '../repository';
import { ObjectId } from 'mongodb';

export { createAssignation };

async function createAssignation({ userId, documentId }: { userId: ObjectId; documentId: ObjectId }) {
  const assignationRepository = buildAssignationRepository();

  const userRole = await userService.fetchUserRole(userId);

  if (userRole === 'publicator' || userRole === 'scrutator') {
    throw new Error(`User ${userId.toHexString()} is a ${userRole} and is trying to create an assignation`);
  }

  const treatmentId = await treatmentService.createEmptyTreatment({
    documentId,
    source: userRole,
  });

  const assignation = assignationModule.lib.buildAssignation({
    userId,
    documentId,
    treatmentId,
    assignationDate: new Date().getTime(),
  });

  await assignationRepository.insert(assignation);

  return assignation;
}
