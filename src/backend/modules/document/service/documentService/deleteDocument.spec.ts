import { buildAssignationRepository } from '../../../assignation/repository';
import { buildTreatmentRepository } from '../../../treatment/repository';
import { assignationModule, documentModule, treatmentModule } from '@src/core';
import { buildDocumentRepository } from '../../repository';
import { deleteDocument } from './deleteDocument';
import { ObjectId } from 'mongodb';

describe('deleteDocument', () => {
  const assignationRepository = buildAssignationRepository();
  const documentRepository = buildDocumentRepository();
  const treatmentRepository = buildTreatmentRepository();

  it('should remove the given document from the database with all its dependencies', async () => {
    const documentId = new ObjectId();
    const assignations = ([{ documentId }, { documentId }, { documentId: new ObjectId() }] as const).map(
      assignationModule.generator.generate,
    );
    const documents = ([{ _id: documentId }, { _id: new ObjectId() }] as const).map(documentModule.generator.generate);
    const treatments = ([{ documentId }, { documentId }, { documentId: new ObjectId() }] as const).map(
      treatmentModule.generator.generate,
    );
    await Promise.all(assignations.map(assignationRepository.insert));
    await Promise.all(documents.map(documentRepository.insert));
    await Promise.all(treatments.map(treatmentRepository.insert));

    await deleteDocument(documentId);

    const assignationsAfterRemove = await assignationRepository.findAll();
    const documentsAfterRemove = await documentRepository.findAll();
    const treatmentsAfterRemove = await treatmentRepository.findAll();
    expect(assignationsAfterRemove).toEqual([assignations[2]]);
    expect(documentsAfterRemove).toEqual([documents[1]]);
    expect(treatmentsAfterRemove).toEqual([treatments[2]]);
  });
});
