import { preAssignationType } from '@src/core';
import { buildFakeRepositoryBuilder, updateFakeCollection } from '../../../repository';
import { customPreAssignationRepositoryType } from './customPreAssignationRepositoryType';
import { ObjectId } from 'mongodb';

export { buildFakePreAssignationRepository };

const buildFakePreAssignationRepository = buildFakeRepositoryBuilder<
  preAssignationType,
  customPreAssignationRepositoryType
>({
  collectionName: 'preAssignations',
  buildCustomFakeRepository: (collection) => ({
    async findOneByNumberAndSource({ number, source }) {
      return collection.find((preAssignation) => preAssignation.source === source && preAssignation.number === number);
    },
    async deleteById(id: ObjectId) {
      updateFakeCollection(
        collection,
        collection.filter((preAssignation) => !preAssignation._id.equals(id)),
      );
    },
  }),
});
