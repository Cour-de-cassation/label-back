import { dependencyManager } from '../../../utils';
import { buildAssignationRepository } from './buildAssignationRepository';
import { buildFakeAssignationRepository } from './buildFakeAssignationRepository';

export { buildRepository as buildAssignationRepository };

const buildRepository = dependencyManager.inject({
  forProd: buildAssignationRepository,
  forTest: buildFakeAssignationRepository,
});
