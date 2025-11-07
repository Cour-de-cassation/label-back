import { treatmentModule } from '@src/core';
import { buildTreatmentRepository } from '../repository';
import { deleteTreatmentsByDocumentId } from './deleteTreatmentsByDocumentId';
import { ObjectId } from 'mongodb';

describe('deleteTreatmentsByDocumentId', () => {
  const treatmentRepository = buildTreatmentRepository();

  it('should remove all the treatments from the database with the given document id', async () => {
    const documentId = new ObjectId();
    const treatments = ([{ documentId }, { documentId }, { documentId: new ObjectId() }] as const).map(
      treatmentModule.generator.generate,
    );
    await Promise.all(treatments.map(treatmentRepository.insert));

    await deleteTreatmentsByDocumentId(documentId);

    const treatmentsAfterRemove = await treatmentRepository.findAll();
    expect(treatmentsAfterRemove).toEqual([treatments[2]]);
  });
});
