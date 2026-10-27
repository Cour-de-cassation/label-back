import { annotationModule, annotationsDiffModule, annotationType, documentType, treatmentModule } from '@src/core';
import { findTreatments } from '../../../connectors/db/treatments';
import { documentService } from '../../document';

export { fetchAnnotationsDiffDetailsForDocument };

async function fetchAnnotationsDiffDetailsForDocument(documentId: documentType['_id']) {
  const document = await documentService.fetchDocument(documentId);
  const treatments = await findTreatments({ documentId });
  const humanTreatments = treatments.filter(
    (treatment) => treatment.source === 'admin' || treatment.source === 'annotator',
  );
  const annotationsDiff = treatmentModule.lib.computeAnnotationsDiff(humanTreatments);
  const {
    addedAnnotations,
    categoryChangedAnnotations,
    deletedAnnotations,
    resizedBiggerAnnotations,
    resizedSmallerAnnotations,
  } = annotationsDiffModule.lib.computeDetailsFromAnnotationsDiff(annotationsDiff);
  return {
    addedAnnotations: addedAnnotations.map((addedAnnotation) => {
      const { text, textStart, annotation } = mapAnnotationToAnnotationsDiffDetails(addedAnnotation);
      return {
        text,
        textStart,
        addedAnnotation: annotation,
      };
    }),
    deletedAnnotations: deletedAnnotations.map((deletedAnnotation) => {
      const { text, textStart, annotation } = mapAnnotationToAnnotationsDiffDetails(deletedAnnotation);

      return {
        text,
        textStart,
        deletedAnnotation: annotation,
      };
    }),
    resizedBiggerAnnotations: resizedBiggerAnnotations.map(mapAnnotationChangeToAnnotationsDiffDetails),
    resizedSmallerAnnotations: resizedSmallerAnnotations.map(mapAnnotationChangeToAnnotationsDiffDetails),
    categoryChangedAnnotations: categoryChangedAnnotations.map(mapAnnotationChangeToAnnotationsDiffDetails),
  };

  function mapAnnotationChangeToAnnotationsDiffDetails([annotationBefore, annotationAfter]: [
    annotationType,
    annotationType,
  ]) {
    const { textStart: annotationBeforeTextStart, textEnd: annotationBeforeTextEnd } =
      annotationModule.lib.computeNearbyText(annotationBefore, document.text);
    const { textStart: annotationAfterTextStart, textEnd: annotationAfterTextEnd } =
      annotationModule.lib.computeNearbyText(annotationAfter, document.text);
    const textStart = Math.min(annotationBeforeTextStart, annotationAfterTextStart);
    const textEnd = Math.max(annotationBeforeTextEnd, annotationAfterTextEnd);

    const text = document.text.substring(textStart, textEnd);

    return {
      text,
      textStart,
      annotationBefore,
      annotationAfter,
    };
  }

  function mapAnnotationToAnnotationsDiffDetails(annotation: annotationType) {
    const { textEnd, textStart } = annotationModule.lib.computeNearbyText(annotation, document.text);
    const text = document.text.substring(textStart, textEnd);
    return {
      text,
      textStart,
      annotation,
    };
  }
}
