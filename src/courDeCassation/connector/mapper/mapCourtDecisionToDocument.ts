import { documentType, documentModule, timeOperator } from '@src/core';
import {
  extractReadableChamberName,
  extractReadableJurisdictionName,
  extractAppealRegisterRoleGeneralNumber,
} from './extractors';
import { categoriesMapper } from './categoriesMapper';
import { Deprecated } from '@src/core';

export { mapCourtDecisionToDocument };

async function mapCourtDecisionToDocument(
  sderCourtDecision: Deprecated.DecisionDTO,
  importer: documentType['importer'],
): Promise<documentType> {
  const readableChamberName = extractReadableChamberName({
    chamberName: sderCourtDecision.chamberName,
    chamberId: sderCourtDecision.chamberId,
  });
  const readableJurisdictionName = extractReadableJurisdictionName(sderCourtDecision.jurisdictionName);
  const creationDate = convertToValidDate(sderCourtDecision.dateCreation);
  const decisionDate = convertToValidDate(sderCourtDecision.dateDecision);
  const source = sderCourtDecision.sourceName;

  const registerNumber = sderCourtDecision.registerNumber;
  const appeal = sderCourtDecision.appeals?.[0];
  const numeroRoleGeneral = isDecisionTJ(sderCourtDecision) ? sderCourtDecision.numeroRoleGeneral : '';
  const appealNumber = extractAppealRegisterRoleGeneralNumber(
    sderCourtDecision.originalText,
    source,
    readableJurisdictionName,
    appeal,
    registerNumber,
    numeroRoleGeneral,
  );

  const publicationCategory = computePublicationCategory(sderCourtDecision.pubCategory, sderCourtDecision.publication);

  const categoriesToOmit = categoriesMapper.mapSderCategoriesToLabelCategories(
    sderCourtDecision.occultation?.categoriesToOmit,
  );

  const solution = sderCourtDecision.solution ? sderCourtDecision.solution.trim() : '';

  const session = sderCourtDecision.formation?.trim() || '';

  const additionalTermsToAnnotate = sderCourtDecision.occultation?.additionalTerms || '';
  const civilCaseCode = sderCourtDecision.natureAffaireCivil?.trim() || '';
  const civilMatterCode = sderCourtDecision.codeMatiereCivil?.trim() || '';
  const criminalCaseCode = sderCourtDecision.natureAffairePenal?.trim() || '';
  const NACCode = sderCourtDecision.NACCode || '';
  const NAOCode = sderCourtDecision.NAOCode || '';
  const endCaseCode = sderCourtDecision.endCaseCode || '';

  const title = computeTitleFromParsedCourtDecision({
    source: source,
    number: sderCourtDecision.sourceId,
    appealNumber,
    readableChamberName,
    readableJurisdictionName,
    NACCode: NACCode,
    NAOCode: NAOCode,
    date: decisionDate,
  });

  const priority = computePriority(
    sderCourtDecision.sourceName,
    publicationCategory,
    NACCode,
    importer,
    sderCourtDecision.raisonInteretParticulier,
  );

  const nlpTreatment = sderCourtDecision.labelTreatments
    ?.filter((treatment) => treatment.source === 'NLP')
    .sort((a, b) => b.order - a.order)[0];

  return documentModule.lib.buildDocument({
    creationDate: creationDate?.getTime(),
    decisionMetadata: {
      appealNumber: appealNumber || '',
      additionalTermsToAnnotate,
      computedAdditionalTerms: {
        additionalTermsToAnnotate: sderCourtDecision.occultation.additionalTermsToAnnotate ?? [],
        additionalTermsToUnAnnotate: sderCourtDecision.occultation.additionalTermsToUnAnnotate ?? [],
      },
      additionalTermsParsingFailed:
        sderCourtDecision.occultation.additionalTermsToUnAnnotate &&
        sderCourtDecision.occultation.additionalTermsToUnAnnotate.length > 0,
      boundDecisionDocumentNumbers: sderCourtDecision.decatt || [],
      categoriesToOmit,
      civilCaseCode,
      civilMatterCode,
      criminalCaseCode,
      chamberName: readableChamberName,
      date: decisionDate?.getTime(),
      jurisdiction: readableJurisdictionName,
      NACCode,
      endCaseCode,
      occultationBlock: sderCourtDecision.blocOccultation || undefined,
      session,
      solution,
      motivationOccultation: sderCourtDecision.occultation.motivationOccultation ?? undefined,
      raisonInteretParticulier: sderCourtDecision.raisonInteretParticulier ?? undefined,
      sommaire: sderCourtDecision.sommaire ?? '',
    },
    documentNumber: sderCourtDecision.sourceId,
    externalId: sderCourtDecision._id ?? '',
    loss: undefined,
    priority,
    publicationCategory,
    route: 'default',
    importer,
    source,
    title,
    text: sderCourtDecision.originalText,
    nlpVersions: nlpTreatment?.version,
    checklist: nlpTreatment?.checklist ?? [],
  });
}

function getPrefixedNumber(numberToPrefix: string | undefined, source: string, readableJurisdictionName: string) {
  if (numberToPrefix === undefined) {
    return undefined;
  }
  if (source === 'jurinet' && readableJurisdictionName.includes('cassation')) {
    return `Pourvoi n°${numberToPrefix}`;
  } else {
    return `RG n°${numberToPrefix}`;
  }
}

function computeTitleFromParsedCourtDecision({
  source,
  number,
  appealNumber,
  readableChamberName,
  readableJurisdictionName,
  NACCode,
  NAOCode,
  date,
}: {
  source: string;
  number: number;
  appealNumber: string | undefined;
  readableChamberName: string;
  readableJurisdictionName: string;
  NACCode: string;
  NAOCode: string;
  date?: Date;
}) {
  const prefixedNumber = getPrefixedNumber(appealNumber, source, readableJurisdictionName);

  if (source === Deprecated.Sources.TJ) {
    readableJurisdictionName = `TJ de ${readableJurisdictionName}`;
  }

  if (source === Deprecated.Sources.TCOM) {
    readableJurisdictionName = `TCOM de ${readableJurisdictionName}`;
  }

  const nomenclatureNumber =
    source === Deprecated.Sources.CC && NAOCode
      ? `NAO ${NAOCode}`
      : (source === Deprecated.Sources.TJ || source === Deprecated.Sources.CA) && NACCode
        ? `NAC ${NACCode}`
        : undefined;

  const readableNumber = `Décision n°${number}`;
  const readableAppealNumber = prefixedNumber ? prefixedNumber : undefined;
  const readableDate = date ? timeOperator.convertTimestampToReadableDate(date.getTime()) : undefined;
  const title = [
    readableNumber,
    readableAppealNumber,
    readableJurisdictionName,
    readableChamberName,
    nomenclatureNumber,
    readableDate,
  ]
    .filter(Boolean)
    .join(' · ');
  return title;
}

function computePublicationCategory(
  pubCategory: Deprecated.DecisionDTO['pubCategory'],
  publication: Deprecated.DecisionDTO['publication'],
): documentType['publicationCategory'] {
  const publicationCategory: string[] = [];
  if (!!pubCategory) {
    publicationCategory.push(pubCategory);
  }
  if (!!publication) {
    publicationCategory.push(...publication);
  }
  return publicationCategory;
}

function computePriority(
  source: Deprecated.DecisionDTO['sourceName'],
  publicationCategory: documentType['publicationCategory'],
  NACCode: Deprecated.DecisionDTO['NACCode'],
  importer: documentType['importer'],
  raisonInteretParticulier: documentType['decisionMetadata']['raisonInteretParticulier'],
): documentType['priority'] {
  if (documentModule.lib.publicationHandler.mustBePublished(publicationCategory, NACCode)) {
    return 4;
  }
  if (raisonInteretParticulier != null) {
    return 2;
  }
  switch (importer) {
    case 'manual':
      return 3;
  }
  switch (source) {
    case 'jurinet':
      return 2;
    default:
      return 0;
  }
}

function convertToValidDate(date: string | undefined) {
  if (!date) {
    return undefined;
  }

  const convertedDate = new Date(date);
  if (isNaN(convertedDate.valueOf())) {
    return undefined;
  }
  return convertedDate;
}

function isDecisionTJ(decision: Deprecated.DecisionDTO): decision is Deprecated.DecisionTJDTO {
  return decision.sourceName === Deprecated.Sources.TJ;
}
