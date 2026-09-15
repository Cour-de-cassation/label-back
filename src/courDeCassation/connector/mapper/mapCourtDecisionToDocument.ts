import { documentType, documentModule, timeOperator, AcceptedDocumentTypes } from '@src/core';
import { extractReadableChamberName, extractNumeroPourvoi } from './extractors';
import { categoriesMapper } from './categoriesMapper';
import {
  DecisionCa,
  DecisionCaV2,
  DecisionCc,
  DecisionCph,
  DecisionTcom,
  DecisionTj,
  LabelTreatments,
} from 'dbsder-api-types';
import { extractRouteForJurinet } from '@src/backend/lib/extractRoute/extractRouteForJurinet';
import { extractRouteForCivilJurisdiction } from '@src/backend/lib/extractRoute/extractRouteForCivilJurisdiction';

export { mapCourtDecisionToDocument };

async function mapCourtDecisionToDocument(
  decision: AcceptedDocumentTypes,
  importer: documentType['importer'],
): Promise<documentType> {
  switch (decision.sourceName) {
    case 'jurinet':
      return mapDecisionCc(decision, importer);
    case 'jurica':
      return mapDecisionCa(decision, importer);
    case 'juricav2':
      return mapDecisionCav2(decision, importer);
    case 'juritj':
      return mapDecisionTj(decision, importer);
    case 'juritcom':
      return mapDecisionTcom(decision, importer);
    case 'portalis-cph':
      return mapDecisionCph(decision, importer);
    default:
      throw new Error(`Source non gérée.`);
  }
}

// ─── Per-type mappers ─────────────────────────────────────────────────────────

async function mapDecisionCc(decision: DecisionCc, importer: documentType['importer']): Promise<documentType> {
  const jurisdictionName = 'Cour de cassation';
  const chamberName = extractReadableChamberName({ chamberId: decision.chamberId ?? undefined });
  const appealNumber = extractNumeroPourvoi(jurisdictionName, decision.appeals[0]);
  const publicationCategory = computePublicationCategoryCc(decision);
  const NACCode = '';
  const NAOCode = decision.NAOCode ?? '';
  const decisionDate = convertToValidDate(decision.dateDecision ?? undefined);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);
  const session = decision.formation?.trim() ?? '';
  const solution = decision.solution?.trim() ?? '';

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate: decision.occultation.additionalTerms,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      categoriesToOmit: categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation.categoriesToOmit),
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      occultationBlock: decision.blocOccultation ?? undefined,
      motivationOccultation: decision.occultation.motivationOccultation ?? undefined,
      raisonInteretParticulier: undefined,
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, NACCode, importer, undefined),
    publicationCategory,
    route: extractRouteForJurinet({
      chamberName,
      checklist: nlpTreatment?.checklist,
      publicationCategory,
      session,
      solution,
    }),
    importer,
    source: decision.sourceName,
    title: computeTitle({
      source: decision.sourceName,
      sourceId: decision.sourceId,
      appealNumber,
      chamberName,
      jurisdictionName,
      NACCode,
      NAOCode,
      date: decisionDate,
    }),
    text: decision.originalText ?? '',
    checklist: nlpTreatment?.checklist,
  });
}

async function mapDecisionCa(decision: DecisionCa, importer: documentType['importer']): Promise<documentType> {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const chamberName = extractReadableChamberName({
    chamberName: decision.chamberName ?? undefined,
    chamberId: decision.chamberId ?? undefined,
  });
  const appealNumber = decision.registerNumber ? decision.registerNumber.split(' ')[0] : '';
  const publicationCategory = [decision.pubCategory];
  const NACCode = decision.NACCode ?? '';
  const decisionDate = convertToValidDate(decision.dateDecision ?? undefined);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);
  const categoriesToOmit = categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation?.categoriesToOmit);
  const additionalTermsToAnnotate = decision.occultation?.additionalTerms ?? '';
  const motivationOccultation = decision.occultation?.motivationOccultation ?? undefined;
  const raisonInteretParticulier = (decision.raisonInteretParticulier as string) ?? null;

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber,
      additionalTermsToAnnotate,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation?.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation?.additionalTermsToUnAnnotate ?? [],
      },
      categoriesToOmit,
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      occultationBlock: decision.blocOccultation ?? undefined,
      motivationOccultation,
      raisonInteretParticulier,
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, NACCode, importer, raisonInteretParticulier),
    publicationCategory,
    route: await extractRouteForCivilJurisdiction({
      sourceId: decision.sourceId,
      sourceName: decision.sourceName,
      NACCode,
      raisonInteretParticulier,
      additionalTermsToAnnotate,
      categoriesToOmit,
      checklist: nlpTreatment?.checklist,
      motivationOccultation,
    }),
    importer,
    source: decision.sourceName,
    title: computeTitle({
      source: decision.sourceName,
      sourceId: decision.sourceId,
      appealNumber,
      chamberName,
      jurisdictionName,
      NACCode,
      NAOCode: '',
      date: decisionDate,
    }),
    text: decision.originalText ?? '',
    checklist: nlpTreatment?.checklist,
  });
}

async function mapDecisionCav2(decision: DecisionCaV2, importer: documentType['importer']): Promise<documentType> {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const chamberName = extractReadableChamberName({
    chamberName: decision.chamberName ?? undefined,
    chamberId: decision.chamberId ?? undefined,
  });
  const appealNumber = decision.registerNumber ? decision.registerNumber.split(' ')[0] : undefined;
  const publicationCategory = ['W'];
  const NACCode = decision.NACCode ?? '';
  const decisionDate = convertToValidDate(decision.dateDecision ?? undefined);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);
  const categoriesToOmit = categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation?.categoriesToOmit);
  const additionalTermsToAnnotate = decision.occultation?.additionalTerms ?? '';
  const motivationOccultation = decision.occultation?.motivationOccultation ?? undefined;
  const raisonInteretParticulier = (decision.raisonInteretParticulier as string) ?? null;

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation?.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation?.additionalTermsToUnAnnotate ?? [],
      },
      categoriesToOmit,
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      occultationBlock: decision.blocOccultation ?? undefined,
      motivationOccultation,
      raisonInteretParticulier,
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, NACCode, importer, raisonInteretParticulier),
    publicationCategory,
    route: await extractRouteForCivilJurisdiction({
      sourceId: decision.sourceId,
      sourceName: decision.sourceName,
      NACCode,
      raisonInteretParticulier,
      additionalTermsToAnnotate,
      categoriesToOmit,
      checklist: nlpTreatment?.checklist,
      motivationOccultation,
    }),
    importer,
    source: decision.sourceName,
    title: computeTitle({
      source: decision.sourceName,
      sourceId: decision.sourceId,
      appealNumber,
      chamberName,
      jurisdictionName,
      NACCode,
      NAOCode: '',
      date: decisionDate,
    }),
    text: decision.originalText ?? '',
    checklist: nlpTreatment?.checklist,
  });
}

async function mapDecisionTj(decision: DecisionTj, importer: documentType['importer']): Promise<documentType> {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const appealNumber = decision.numeroRoleGeneral;
  const publicationCategory: string[] = [];
  const NACCode = decision.NACCode;
  const decisionDate = convertToValidDate(decision.dateDecision);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);
  const categoriesToOmit = categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation?.categoriesToOmit);
  const additionalTermsToAnnotate = decision.occultation?.additionalTerms ?? '';
  const motivationOccultation = decision.occultation?.motivationOccultation ?? undefined;
  const raisonInteretParticulier = (decision.raisonInteretParticulier as string) ?? null;

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      categoriesToOmit,
      chamberName: '',
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      occultationBlock: decision.blocOccultation,
      motivationOccultation,
      raisonInteretParticulier,
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, NACCode, importer, raisonInteretParticulier),
    publicationCategory,
    route: await extractRouteForCivilJurisdiction({
      sourceId: decision.sourceId,
      sourceName: decision.sourceName,
      NACCode,
      raisonInteretParticulier,
      additionalTermsToAnnotate,
      categoriesToOmit,
      checklist: nlpTreatment?.checklist,
      motivationOccultation,
    }),
    importer,
    source: decision.sourceName,
    title: computeTitle({
      source: decision.sourceName,
      sourceId: decision.sourceId,
      appealNumber,
      chamberName: '',
      jurisdictionName,
      NACCode,
      NAOCode: '',
      date: decisionDate,
    }),
    text: decision.originalText,
    checklist: nlpTreatment?.checklist,
  });
}

async function mapDecisionTcom(decision: DecisionTcom, importer: documentType['importer']): Promise<documentType> {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const chamberName = extractReadableChamberName({
    chamberName: decision.chamberName ?? undefined,
    chamberId: decision.chamberId ?? undefined,
  });
  const appealNumber = decision.registerNumber;
  const publicationCategory: string[] = [];
  const decisionDate = convertToValidDate(decision.dateDecision);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);
  const categoriesToOmit = categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation?.categoriesToOmit);
  const additionalTermsToAnnotate = decision.occultation?.additionalTerms ?? '';
  const motivationOccultation = decision.occultation?.motivationOccultation ?? undefined;
  const raisonInteretParticulier = null;
  const NACCode = '';

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      categoriesToOmit,
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      occultationBlock: decision.blocOccultation,
      motivationOccultation,
      raisonInteretParticulier,
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, '', importer, undefined),
    publicationCategory,
    route: await extractRouteForCivilJurisdiction({
      sourceId: decision.sourceId,
      sourceName: decision.sourceName,
      NACCode,
      raisonInteretParticulier,
      additionalTermsToAnnotate,
      categoriesToOmit,
      checklist: nlpTreatment?.checklist,
      motivationOccultation,
    }),
    importer,
    source: decision.sourceName,
    title: computeTitle({
      source: decision.sourceName,
      sourceId: decision.sourceId,
      appealNumber,
      chamberName,
      jurisdictionName,
      NACCode: '',
      NAOCode: '',
      date: decisionDate,
    }),
    text: decision.originalText,
    checklist: nlpTreatment?.checklist,
  });
}

async function mapDecisionCph(decision: DecisionCph, importer: documentType['importer']): Promise<documentType> {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const appealNumber = decision.portalisNumber;
  const publicationCategory: string[] = [];
  const NACCode = decision.NACCode;
  const decisionDate = convertToValidDate(decision.dateDecision);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);
  const categoriesToOmit = categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation?.categoriesToOmit);
  const additionalTermsToAnnotate = decision.occultation?.additionalTerms ?? '';
  const motivationOccultation = decision.occultation?.motivationOccultation ?? undefined;
  const raisonInteretParticulier = (decision.raisonInteretParticulier as string) ?? null;

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      categoriesToOmit,
      chamberName: '',
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      occultationBlock: decision.blocOccultation,
      motivationOccultation,
      raisonInteretParticulier,
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, NACCode, importer, raisonInteretParticulier),
    publicationCategory,
    route: await extractRouteForCivilJurisdiction({
      sourceId: decision.sourceId,
      sourceName: decision.sourceName,
      NACCode,
      raisonInteretParticulier,
      additionalTermsToAnnotate,
      categoriesToOmit,
      checklist: nlpTreatment?.checklist,
      motivationOccultation,
    }),
    importer,
    source: decision.sourceName,
    title: computeTitle({
      source: decision.sourceName,
      sourceId: decision.sourceId,
      appealNumber,
      chamberName: '',
      jurisdictionName,
      NACCode,
      NAOCode: '',
      date: decisionDate,
    }),
    text: decision.originalText,
    checklist: nlpTreatment?.checklist,
  });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function computeTitle({
  source,
  sourceId,
  appealNumber,
  chamberName,
  jurisdictionName,
  NACCode,
  NAOCode,
  date,
}: {
  source: string;
  sourceId: number | string;
  appealNumber: string | undefined;
  chamberName: string;
  jurisdictionName: string;
  NACCode: string;
  NAOCode: string;
  date: Date | undefined;
}): string {
  let readableJurisdictionName = jurisdictionName;
  if (source === 'juritj') readableJurisdictionName = `TJ de ${jurisdictionName}`;
  if (source === 'juritcom') readableJurisdictionName = `TCOM de ${jurisdictionName}`;

  const prefixedAppealNumber = formatAppealNumber(appealNumber, source, readableJurisdictionName);

  const nomenclatureNumber =
    source === 'jurinet' && NAOCode
      ? `NAO ${NAOCode}`
      : (source === 'juritj' || source === 'jurica' || source === 'juricav2') && NACCode
        ? `NAC ${NACCode}`
        : undefined;

  const readableDate = date ? timeOperator.convertTimestampToReadableDate(date.getTime()) : undefined;

  return [
    `Décision n°${sourceId}`,
    prefixedAppealNumber,
    readableJurisdictionName,
    chamberName,
    nomenclatureNumber,
    readableDate,
  ]
    .filter(Boolean)
    .join(' · ');
}

function formatAppealNumber(
  appealNumber: string | undefined,
  source: string,
  readableJurisdictionName: string,
): string | undefined {
  if (appealNumber === undefined) return undefined;
  if (source === 'jurinet' && readableJurisdictionName.includes('cassation')) {
    return `Pourvoi n°${appealNumber}`;
  }
  if (source === 'portalis-cph') {
    return `Numéro Portalis : ${appealNumber}`;
  }
  return `RG n°${appealNumber}`;
}

function computePublicationCategoryCc(decision: DecisionCc): string[] {
  const categories: string[] = [];
  if (decision.pubCategory) categories.push(decision.pubCategory);
  if (decision.publication) categories.push(...decision.publication);
  return categories;
}

function extractNlpTreatment(labelTreatments: LabelTreatments | undefined) {
  return labelTreatments?.filter((treatment) => treatment.source === 'NLP').sort((a, b) => b.order - a.order)[0];
}

function computePriority(
  source: string,
  publicationCategory: documentType['publicationCategory'],
  NACCode: string,
  importer: documentType['importer'],
  raisonInteretParticulier: documentType['decisionMetadata']['raisonInteretParticulier'],
): documentType['priority'] {
  if (documentModule.lib.publicationHandler.mustBePublished(publicationCategory, NACCode)) {
    return 4;
  }
  if (importer === 'manual') {
    return 3;
  }
  if (raisonInteretParticulier != null) {
    return 2;
  }
  if (source === 'jurinet') {
    return 2;
  }
  return 0;
}

function convertToValidDate(date: string | undefined): Date | undefined {
  if (!date) return undefined;
  const converted = new Date(date);
  return isNaN(converted.valueOf()) ? undefined : converted;
}
