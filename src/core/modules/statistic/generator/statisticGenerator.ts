import { checklistGenerator } from '../../document/generator';
import { generatorType } from '../../../types';
import { statisticType } from '../statisticType';
import { ObjectId } from 'mongodb';

export { statisticGenerator };

const statisticGenerator: generatorType<statisticType> = {
  generate: ({
    _id,
    annotationsCount,
    appealNumber,
    chamberName,
    decisionDate,
    documentExternalId,
    documentNumber,
    jurisdiction,
    linkedEntitiesCount,
    publicationCategory,
    session,
    route,
    importer,
    source,
    subAnnotationsSensitiveCount,
    surAnnotationsCount,
    subAnnotationsNonSensitiveCount,
    treatmentDate,
    treatmentsSummary,
    wordsCount,
    endCaseCode,
    NACCode,
    checklist,
    comment,
  } = {}) => ({
    _id: _id ? _id : new ObjectId(),
    annotationsCount: annotationsCount ? annotationsCount : 0,
    appealNumber: appealNumber ? appealNumber : undefined,
    chamberName: chamberName || `SOURCE_${Math.random()}`,
    decisionDate: decisionDate,
    documentExternalId: documentExternalId ? documentExternalId : new ObjectId().toHexString(),
    documentNumber: documentNumber !== undefined ? documentNumber : Math.floor(Math.random() * 1000000),
    jurisdiction: jurisdiction ? jurisdiction : '',
    linkedEntitiesCount: linkedEntitiesCount ? linkedEntitiesCount : 0,
    publicationCategory: publicationCategory ? publicationCategory : [],
    session: session || undefined,
    endCaseCode: endCaseCode || undefined,
    NACCode: NACCode || undefined,
    route: route ?? `default`,
    importer: importer ?? `default`,
    source: source ?? `SOURCE_${Math.random()}`,
    subAnnotationsNonSensitiveCount:
      subAnnotationsNonSensitiveCount !== undefined ? subAnnotationsNonSensitiveCount : 0,
    subAnnotationsSensitiveCount: subAnnotationsSensitiveCount !== undefined ? subAnnotationsSensitiveCount : 0,
    surAnnotationsCount: surAnnotationsCount !== undefined ? surAnnotationsCount : 0,
    treatmentDate: treatmentDate ? treatmentDate : new Date().getTime(),
    treatmentsSummary: treatmentsSummary ? treatmentsSummary : [],
    wordsCount: wordsCount ? wordsCount : 0,
    checklist: checklist ? checklist : checklistGenerator.generate(3),
    comment: comment ? comment : 'comment',
  }),
};
