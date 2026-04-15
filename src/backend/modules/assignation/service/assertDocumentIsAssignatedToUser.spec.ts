import { assignationModule } from '@src/core';
import { ObjectId } from 'mongodb';
import { buildAssignationRepository } from '../repository';
import { assertDocumentIsAssignatedToUser } from './assertDocumentIsAssignatedToUser';

describe('assertDocumentIsAssignatedToUser', () => {
  it('should throw one error', async () => {
    const assignationRepository = buildAssignationRepository();
    const userId = new ObjectId();
    const documentId = new ObjectId();
    const otherDocumentId = new ObjectId();
    const assignation = assignationModule.generator.generate({
      userId,
      documentId,
    });
    await assignationRepository.insert(assignation);

    const failingAssertion = () =>
      assertDocumentIsAssignatedToUser({
        documentId: otherDocumentId,
        userId,
      });

    await assertDocumentIsAssignatedToUser({
      documentId,
      userId,
    });
    expect(failingAssertion()).rejects.toThrow();
  });
});
