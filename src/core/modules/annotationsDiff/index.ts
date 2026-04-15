import { annotationsDiffType } from './annotationsDiffType';
import { annotationsDiffGenerator } from './generator';
import {
  applyToAnnotations,
  assertAnnotationsDiffAreConsistent,
  buildAnnotationsDiff,
  computeAnnotationsDiff,
  computeDetailsFromAnnotationsDiff,
  inverse,
  squash,
} from './lib';

export { annotationsDiffModule };

export type { annotationsDiffType };

const annotationsDiffModule = {
  generator: annotationsDiffGenerator,
  lib: {
    applyToAnnotations,
    assertAnnotationsDiffAreConsistent,
    buildAnnotationsDiff,
    computeAnnotationsDiff,
    computeDetailsFromAnnotationsDiff,
    inverse,
    squash,
  },
};
