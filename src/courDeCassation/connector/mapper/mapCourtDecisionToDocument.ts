import { documentType, documentModule, timeOperator, AcceptedDocumentTypes } from '@src/core';
import { extractReadableChamberName, extractNumeroPourvoi } from './extractors';
import { categoriesMapper } from './categoriesMapper';
import { DecisionCa, DecisionCc, DecisionTcom, DecisionTj, LabelTreatments } from 'dbsder-api-types';

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
    case 'juritj':
      return mapDecisionTj(decision, importer);
    case 'juritcom':
      return mapDecisionTcom(decision, importer);
  }
}

// ─── Per-type mappers ─────────────────────────────────────────────────────────

function mapDecisionCc(decision: DecisionCc, importer: documentType['importer']): documentType {
  const jurisdictionName = 'Cour de cassation';
  const chamberName = extractReadableChamberName({ chamberId: decision.chamberId ?? undefined });
  const appealNumber = extractNumeroPourvoi(jurisdictionName, decision.appeals[0]);
  const publicationCategory = computePublicationCategoryCc(decision);
  const NACCode = '';
  const NAOCode = decision.NAOCode ?? '';
  const decisionDate = convertToValidDate(decision.dateDecision ?? undefined);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate: decision.occultation.additionalTerms,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      additionalTermsParsingFailed: (decision.occultation.additionalTermsToUnAnnotate?.length ?? 0) > 0,
      categoriesToOmit: categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation.categoriesToOmit),
      civilCaseCode: decision.natureAffaireCivil?.trim() ?? '',
      civilMatterCode: decision.codeMatiereCivil?.trim() ?? '',
      criminalCaseCode: decision.natureAffairePenal?.trim() ?? '',
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      endCaseCode: '',
      occultationBlock: decision.blocOccultation ?? undefined,
      session: decision.formation?.trim() ?? '',
      solution: decision.solution?.trim() ?? '',
      motivationOccultation: decision.occultation.motivationOccultation ?? undefined,
      raisonInteretParticulier: undefined,
      sommaire: '',
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, NACCode, importer, undefined),
    publicationCategory,
    route: 'default',
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
    nlpVersions: nlpTreatment?.version,
    checklist: nlpTreatment?.checklist,
  });
}

function mapDecisionCa(decision: DecisionCa, importer: documentType['importer']): documentType {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const chamberName = extractReadableChamberName({
    chamberName: decision.chamberName ?? undefined,
    chamberId: decision.chamberId ?? undefined,
  });
  const appealNumber = decision.registerNumber ? decision.registerNumber.split(' ')[0] : undefined;
  const publicationCategory = [decision.pubCategory];
  const NACCode = decision.NACCode ?? '';
  const decisionDate = convertToValidDate(decision.dateDecision ?? undefined);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate: decision.occultation?.additionalTerms ?? '',
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation?.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation?.additionalTermsToUnAnnotate ?? [],
      },
      additionalTermsParsingFailed: (decision.occultation?.additionalTermsToUnAnnotate?.length ?? 0) > 0,
      categoriesToOmit: categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation?.categoriesToOmit),
      civilCaseCode: '',
      civilMatterCode: '',
      criminalCaseCode: '',
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      endCaseCode: decision.endCaseCode ?? '',
      occultationBlock: decision.blocOccultation ?? undefined,
      session: '',
      solution: decision.solution?.trim() ?? '',
      motivationOccultation: decision.occultation?.motivationOccultation ?? undefined,
      raisonInteretParticulier: decision.raisonInteretParticulier ?? undefined,
      sommaire: decision.sommaire ?? '',
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(
      decision.sourceName,
      publicationCategory,
      NACCode,
      importer,
      decision.raisonInteretParticulier ?? undefined,
    ),
    publicationCategory,
    route: 'default',
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
    nlpVersions: nlpTreatment?.version,
    checklist: nlpTreatment?.checklist,
  });
}

function mapDecisionTj(decision: DecisionTj, importer: documentType['importer']): documentType {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const appealNumber = decision.numeroRoleGeneral;
  const publicationCategory: string[] = [];
  const NACCode = decision.NACCode;
  const decisionDate = convertToValidDate(decision.dateDecision);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate: decision.occultation.additionalTerms,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      additionalTermsParsingFailed: (decision.occultation.additionalTermsToUnAnnotate?.length ?? 0) > 0,
      categoriesToOmit: categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation.categoriesToOmit),
      civilCaseCode: '',
      civilMatterCode: '',
      criminalCaseCode: '',
      chamberName: '',
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode,
      endCaseCode: decision.endCaseCode,
      occultationBlock: decision.blocOccultation,
      session: decision.formation?.trim() ?? '',
      solution: decision.solution?.trim() ?? '',
      motivationOccultation: decision.occultation.motivationOccultation ?? undefined,
      raisonInteretParticulier: decision.raisonInteretParticulier ?? undefined,
      sommaire: decision.sommaire ?? '',
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(
      decision.sourceName,
      publicationCategory,
      NACCode,
      importer,
      decision.raisonInteretParticulier ?? undefined,
    ),
    publicationCategory,
    route: 'default',
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
    nlpVersions: nlpTreatment?.version,
    checklist: nlpTreatment?.checklist,
  });
}

function mapDecisionTcom(decision: DecisionTcom, importer: documentType['importer']): documentType {
  const jurisdictionName = decision.jurisdictionName?.trim() ?? '';
  const chamberName = extractReadableChamberName({
    chamberName: decision.chamberName ?? undefined,
    chamberId: decision.chamberId ?? undefined,
  });
  const appealNumber = decision.registerNumber;
  const publicationCategory: string[] = [];
  const decisionDate = convertToValidDate(decision.dateDecision);
  const nlpTreatment = extractNlpTreatment(decision.labelTreatments);

  return documentModule.lib.buildDocument({
    creationDate: convertToValidDate(decision.dateCreation)?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber ?? '',
      additionalTermsToAnnotate: decision.occultation.additionalTerms,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: decision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: decision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      additionalTermsParsingFailed: (decision.occultation.additionalTermsToUnAnnotate?.length ?? 0) > 0,
      categoriesToOmit: categoriesMapper.mapSderCategoriesToLabelCategories(decision.occultation.categoriesToOmit),
      civilCaseCode: '',
      civilMatterCode: decision.codeMatiereCivil?.trim() ?? '',
      criminalCaseCode: '',
      chamberName,
      date: decisionDate?.getTime(),
      jurisdiction: jurisdictionName,
      NACCode: '',
      endCaseCode: '',
      occultationBlock: decision.blocOccultation,
      session: '',
      solution: decision.solution?.trim() ?? '',
      motivationOccultation: decision.occultation.motivationOccultation ?? undefined,
      raisonInteretParticulier: undefined,
      sommaire: '',
    },
    documentNumber: decision.sourceId,
    externalId: decision._id,
    priority: computePriority(decision.sourceName, publicationCategory, '', importer, undefined),
    publicationCategory,
    route: 'default',
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
    nlpVersions: nlpTreatment?.version,
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
  sourceId: number;
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
      : (source === 'juritj' || source === 'jurica') && NACCode
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
  if (raisonInteretParticulier != null) {
    return 2;
  }
  if (importer === 'manual') {
    return 3;
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
