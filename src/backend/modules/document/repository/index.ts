import { dependencyManager } from '../../../utils';
import { buildDocumentRepository } from './buildDocumentRepository';
import { buildFakeDocumentRepository } from './buildFakeDocumentRepository';

export { buildRepository as buildDocumentRepository };

const buildRepository = dependencyManager.inject({
  forProd: buildDocumentRepository,
  forTest: buildFakeDocumentRepository,
});
