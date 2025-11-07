import { idType } from '../id';
import { documentRouteType, documentImporterType } from '../document';

export type ressourceFilterType = {
  mustHaveSurAnnotations: boolean;
  mustHaveSubAnnotations: boolean;
  publicationCategory?: string;
  startDate?: number;
  endDate?: number;
  route?: documentRouteType;
  importer?: documentImporterType;
  source?: string;
  jurisdiction?: string;
  userId?: idType;
};
