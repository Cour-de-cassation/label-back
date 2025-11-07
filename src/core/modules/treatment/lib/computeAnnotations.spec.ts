import { annotationModule } from '../../annotation';
import { annotationsDiffModule } from '../../annotationsDiff';
import { ObjectId } from 'mongodb';
import { treatmentGenerator } from '../generator';
import { computeAnnotations, computeAnnotationsDiff } from './computeAnnotations';

describe('computeAnnotations', () => {
  const annotations = [{ text: '0' }, { text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }].map(
    annotationModule.generator.generate,
  );
  const documentId = new ObjectId();

  it('should compute the annotations set from treatments', () => {
    const treatments = [
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [],
          after: [annotations[0], annotations[1]],
        }),
        documentId,
        order: 0,
        source: 'NLP' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[0]],
          after: [annotations[2]],
        }),
        documentId,
        order: 1,
        source: 'postProcess' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[1]],
          after: [annotations[3], annotations[4]],
        }),
        documentId,
        order: 2,
        source: 'annotator' as const,
      },
    ].map(treatmentGenerator.generate);

    const annotationsFromTreatments = computeAnnotations(treatments);

    expect(annotationModule.lib.sortAnnotations(annotationsFromTreatments)).toEqual(
      annotationModule.lib.sortAnnotations([annotations[2], annotations[3], annotations[4]]),
    );
  });

  it('should throw if the treatment are not on the same document', () => {
    const treatments = [
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [],
          after: [annotations[0], annotations[1]],
        }),
        documentId: new ObjectId(),
        order: 0,
        source: 'NLP' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[0]],
          after: [annotations[2]],
        }),
        documentId: new ObjectId(),
        order: 1,
        source: 'postProcess' as const,
      },
    ].map(treatmentGenerator.generate);

    expect(() => computeAnnotations(treatments)).toThrow(
      `Can not compute annotations from inconsistent treatments : [${treatments[0]._id.toHexString()}, ${treatments[1]._id.toHexString()}]`,
    );
  });

  it('should throw if the first treatment is empty at the beginning', () => {
    const treatments = [
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[3]],
          after: [annotations[0], annotations[1]],
        }),
        documentId,
        order: 0,
        source: 'NLP' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[0]],
          after: [annotations[2]],
        }),
        documentId,
        order: 1,
        source: 'postProcess' as const,
      },
    ].map(treatmentGenerator.generate);

    expect(() => computeAnnotations(treatments)).toThrow(
      `Can not compute annotations from inconsistent treatments : [${treatments[0]._id.toHexString()}, ${treatments[1]._id.toHexString()}]`,
    );
  });

  it('should throw if there are missing treatments', () => {
    const treatments = [
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [],
          after: [annotations[0], annotations[1]],
        }),
        documentId,
        order: 0,
        source: 'NLP' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[0]],
          after: [annotations[2]],
        }),
        documentId,
        order: 2,
        source: 'postProcess' as const,
      },
    ].map(treatmentGenerator.generate);

    expect(() => computeAnnotations(treatments)).toThrow(
      `Can not compute annotations from inconsistent treatments : [${treatments[0]._id.toHexString()}, ${treatments[1]._id.toHexString()}]`,
    );
  });
});

describe('computeAnnotationsDiff', () => {
  const annotations = [{ text: '0' }, { text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }].map(
    annotationModule.generator.generate,
  );
  const documentId = new ObjectId();

  it('should compute the annotations set from treatments', () => {
    const treatments = [
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [],
          after: [annotations[0], annotations[1]],
        }),
        documentId,
        order: 0,
        source: 'NLP' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[0]],
          after: [annotations[2]],
        }),
        documentId,
        order: 1,
        source: 'postProcess' as const,
      },
      {
        annotationsDiff: annotationsDiffModule.generator.generate({
          before: [annotations[1]],
          after: [annotations[3], annotations[4]],
        }),
        documentId,
        order: 2,
        source: 'annotator' as const,
      },
    ].map(treatmentGenerator.generate);

    const annotationDiffs = computeAnnotationsDiff(treatments);

    expect(annotationDiffs).toEqual({
      before: [],
      after: [annotations[2], annotations[3], annotations[4]],
    });
  });
});
