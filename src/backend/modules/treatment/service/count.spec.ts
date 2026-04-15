import { treatmentModule } from '@src/core';
import { buildTreatmentRepository } from '../repository';
import { countTreatmentsByDocumentId } from './count';
import { ObjectId } from 'mongodb';

describe('count', () => {
  const treatmentRepository = buildTreatmentRepository();

  it('count the treatments by documentId', async () => {
    const documentId = new ObjectId();
    const treatments = ([{ documentId }, { documentId }, { documentId: new ObjectId() }] as const).map(
      treatmentModule.generator.generate,
    );
    await Promise.all(treatments.map(treatmentRepository.insert));

    const count = await countTreatmentsByDocumentId({ documentId });

    expect(count).toEqual(2);
  });
});
