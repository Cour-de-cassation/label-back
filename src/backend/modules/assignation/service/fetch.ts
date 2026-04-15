import { assignationType, documentType, indexer, userType } from '@src/core';
import { buildAssignationRepository } from '../repository';
import { ObjectId } from 'mongodb';

export {
  fetchAllAssignationsById,
  fetchAssignation,
  fetchAssignationId,
  fetchAssignationsByDocumentIds,
  fetchAssignationsOfDocumentId,
  fetchDocumentIdsAssignatedToUserId,
};

async function fetchAssignation(assignationId: assignationType['_id']) {
  const assignationRepository = buildAssignationRepository();

  return assignationRepository.findById(assignationId);
}

async function fetchAllAssignationsById(assignationIds?: assignationType['_id'][]) {
  const assignationRepository = buildAssignationRepository();

  const assignationsById = await assignationRepository.findAllByIds(assignationIds);

  if (assignationIds) {
    indexer.assertEveryIdIsDefined(
      assignationIds.map((assignationId) => assignationId.toHexString()),
      assignationsById,
      (_id) => `The assignation id ${_id} has no matching assignation`,
    );
  }

  return assignationsById;
}

async function fetchAssignationId({ userId, documentId }: { userId: ObjectId; documentId: ObjectId }) {
  const assignationRepository = buildAssignationRepository();
  const assignations = await assignationRepository.findAllByUserId(userId);
  const assignation = assignations.find((assignation) => assignation.documentId.equals(documentId));

  return assignation?._id;
}

async function fetchAssignationsByDocumentIds(
  documentIdsToSearchIn: ObjectId[],
  options: { assertEveryDocumentIsAssigned: boolean },
) {
  const assignationRepository = buildAssignationRepository();

  const assignationsByDocumentIds = await assignationRepository.findAllByDocumentIds(documentIdsToSearchIn);

  if (options?.assertEveryDocumentIsAssigned) {
    indexer.assertEveryIdIsDefined(
      documentIdsToSearchIn.map((documentId) => documentId.toHexString()),
      assignationsByDocumentIds,
      (_id) => `The document ${_id} has no matching assignations`,
    );
  }
  return assignationsByDocumentIds;
}

async function fetchAssignationsOfDocumentId(documentId: ObjectId): Promise<assignationType[]> {
  const assignationRepository = buildAssignationRepository();

  return assignationRepository.findAllByDocumentId(documentId);
}

async function fetchDocumentIdsAssignatedToUserId(userId: userType['_id']): Promise<
  Array<{
    documentId: documentType['_id'];
    assignationId: assignationType['_id'];
  }>
> {
  const assignationRepository = buildAssignationRepository();
  const assignations = await assignationRepository.findAllByUserId(userId);

  return assignations.map((assignation) => ({
    documentId: assignation.documentId as documentType['_id'],
    assignationId: assignation._id as assignationType['_id'],
  }));
}
