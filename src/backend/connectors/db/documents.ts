import { Document, Filter, ObjectId } from 'mongodb';
import { assignationType, documentType, treatmentType, userType } from '@src/core';
import { mongo } from '../../utils';
import { buildProjection } from './projection';

const documents = () => mongo.getDb().collection<documentType>('documents');

export async function ensureDocumentsIndexes() {
  await documents().createIndex({ status: 1 });
  await documents().createIndex({ route: 1 });
  await documents().createIndex({ publicationCategory: 1, status: 1 });
  await documents().createIndex({ priority: 1, status: 1 });
}

export async function insertDocument(document: documentType) {
  await documents().insertOne(document);
}

export async function findDocuments(filter: Filter<documentType> = {}, limit?: number) {
  const cursor = documents().find(filter);
  return (limit !== undefined ? cursor.limit(limit) : cursor).toArray();
}

export async function findDocumentsProjection<K extends keyof documentType>(filter: Filter<documentType>, fields: K[]) {
  return documents()
    .find(filter)
    .project<Pick<documentType, K | '_id'>>(buildProjection<documentType>(fields))
    .toArray();
}

export async function findDocument(filter: Filter<documentType>) {
  return (await documents().findOne(filter)) ?? undefined;
}

export async function findDocumentById(_id: ObjectId) {
  const document = await documents().findOne({ _id });
  if (!document) {
    throw new Error(`No matching documents for _id ${_id}`);
  }
  return document;
}

export async function countDocuments(filter: Filter<documentType> = {}) {
  return documents().countDocuments(filter);
}

/**
 * Pick a random document having at least one treatment among the 50 most recent and the 50 oldest
 * (by decision date) matching the filter, to treat a mix of recent and old documents.
 */
export async function findRandomDocumentToTreat(filter: Filter<documentType>) {
  const findTreatedDocuments = (direction: 1 | -1) =>
    documents()
      .aggregate<documentType>([
        { $match: filter },
        { $sort: { 'decisionMetadata.date': direction } },
        {
          $lookup: {
            from: 'treatments',
            localField: '_id',
            foreignField: 'documentId',
            as: 'treatments',
            pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
          },
        },
        { $match: { 'treatments.0': { $exists: true } } },
        { $limit: 50 },
        { $project: { treatments: 0 } },
      ])
      .toArray();

  const combinedDocuments = [...(await findTreatedDocuments(-1)), ...(await findTreatedDocuments(1))];

  if (combinedDocuments.length === 0) {
    return undefined;
  }
  return combinedDocuments[Math.floor(Math.random() * combinedDocuments.length)];
}

const lookupAssignations: Document = {
  $lookup: { from: 'assignations', localField: '_id', foreignField: 'documentId', as: 'assignations' },
};

const lookupAssignedUsers: Document = {
  $lookup: {
    from: 'users',
    localField: 'assignations.userId',
    foreignField: '_id',
    as: 'assignedUsers',
    pipeline: [{ $project: { name: 1 } }],
  },
};

const lookupTreatments: Document = {
  $lookup: {
    from: 'treatments',
    localField: '_id',
    foreignField: 'documentId',
    as: 'treatments',
    pipeline: [{ $sort: { order: 1 } }],
  },
};

function projectFields<K extends keyof documentType>(fields?: K[]): Document[] {
  return fields ? [{ $project: buildProjection<documentType>(fields) }] : [];
}

type documentWithAssignationsType<K extends keyof documentType> = Pick<documentType, K | '_id'> & {
  assignations: assignationType[];
  assignedUsers: Pick<userType, '_id' | 'name'>[];
};

/** Names of the users of the given assignations (as `$$assignation` items), skipping missing users */
function assignedUserNames(assignationsExpression: unknown, userIdPath = '$$assignation.userId') {
  return {
    $filter: {
      input: {
        $map: {
          input: assignationsExpression,
          as: 'assignation',
          in: {
            $getField: {
              field: 'name',
              input: {
                $first: {
                  $filter: { input: '$assignedUsers', as: 'user', cond: { $eq: ['$$user._id', userIdPath] } },
                },
              },
            },
          },
        },
      },
      as: 'name',
      cond: { $eq: [{ $type: '$$name' }, 'string'] },
    },
  };
}

/** Treatments matching the assignations of the document sorted by order, as `{ treatment, userId }` */
const addHumanTreatments: Document = {
  $set: {
    humanTreatments: {
      $sortArray: {
        input: {
          $filter: {
            input: {
              $map: {
                input: '$assignations',
                as: 'assignation',
                in: {
                  userId: '$$assignation.userId',
                  treatment: {
                    $first: {
                      $filter: {
                        input: '$treatments',
                        as: 'treatment',
                        cond: { $eq: ['$$treatment._id', '$$assignation.treatmentId'] },
                      },
                    },
                  },
                },
              },
            },
            as: 'humanTreatment',
            cond: { $eq: [{ $type: '$$humanTreatment.treatment' }, 'object'] },
          },
        },
        sortBy: { 'treatment.order': 1 },
      },
    },
  },
};

/** Human treatments infos, or nothing when the document has no assignation */
function ifAssigned(expression: unknown) {
  return { $cond: [{ $gt: [{ $size: '$assignations' }, 0] }, expression, '$$REMOVE'] };
}

const humanTreatmentsSummary = {
  totalTreatmentDuration: ifAssigned({ $sum: '$humanTreatments.treatment.duration' }),
  lastTreatmentDate: ifAssigned({ $last: '$humanTreatments.treatment.lastUpdateDate' }),
  userNames: assignedUserNames('$humanTreatments'),
};

const lookupTreatmentsSummaries: Document = {
  $lookup: {
    from: 'treatments',
    localField: '_id',
    foreignField: 'documentId',
    as: 'treatments',
    pipeline: [
      {
        $project: {
          order: 1,
          duration: 1,
          lastUpdateDate: 1,
          subAnnotationsNonSensitiveCount: 1,
          subAnnotationsSensitiveCount: 1,
          surAnnotationsCount: 1,
        },
      },
    ],
  },
};

/** Untreated documents with the names of the assigned users (none for free documents) */
export async function findUntreatedDocuments() {
  return documents()
    .aggregate<{
      document: Pick<
        documentType,
        '_id' | 'creationDate' | 'documentNumber' | 'publicationCategory' | 'source' | 'route' | 'status'
      > & {
        decisionDate?: documentType['decisionMetadata']['date'];
        occultationBlock?: documentType['decisionMetadata']['occultationBlock'];
        jurisdiction: documentType['decisionMetadata']['jurisdiction'];
      };
      userNames: string[];
    }>([
      { $match: { status: { $in: ['free', 'pending', 'saved', 'locked'] } } },
      lookupAssignations,
      lookupAssignedUsers,
      {
        $project: {
          _id: 0,
          document: {
            _id: '$_id',
            creationDate: '$creationDate',
            decisionDate: '$decisionMetadata.date',
            documentNumber: '$documentNumber',
            occultationBlock: '$decisionMetadata.occultationBlock',
            jurisdiction: '$decisionMetadata.jurisdiction',
            publicationCategory: '$publicationCategory',
            source: '$source',
            route: '$route',
            status: '$status',
          },
          // Assignations of free documents are not relevant
          userNames: { $cond: [{ $eq: ['$status', 'free'] }, [], assignedUserNames('$assignations')] },
        },
      },
    ])
    .toArray();
}

/** Documents to be confirmed with the summary of their human treatments */
export async function findToBeConfirmedDocuments() {
  return documents()
    .aggregate<{
      document: Pick<documentType, '_id' | 'documentNumber' | 'publicationCategory' | 'route' | 'reviewStatus'> & {
        jurisdiction: documentType['decisionMetadata']['jurisdiction'];
        occultationBlock?: documentType['decisionMetadata']['occultationBlock'];
      };
      totalTreatmentDuration?: number;
      lastTreatmentDate?: number;
      userNames: string[];
    }>([
      { $match: { status: 'toBeConfirmed' } },
      lookupAssignations,
      lookupAssignedUsers,
      lookupTreatmentsSummaries,
      addHumanTreatments,
      {
        $project: {
          _id: 0,
          document: {
            _id: '$_id',
            documentNumber: '$documentNumber',
            jurisdiction: '$decisionMetadata.jurisdiction',
            occultationBlock: '$decisionMetadata.occultationBlock',
            publicationCategory: '$publicationCategory',
            route: '$route',
            reviewStatus: '$reviewStatus',
          },
          ...humanTreatmentsSummary,
        },
      },
    ])
    .toArray();
}

/**
 * Treated documents with the summary of their human treatments.
 * The annotations counts come from the human treatment when there is only one; when there are several,
 * `humanTreatmentIds` (sorted by order) is returned instead so the counts can be aggregated with the settings.
 */
export async function findTreatedDocuments() {
  return documents()
    .aggregate<{
      document: Pick<
        documentType,
        '_id' | 'creationDate' | 'documentNumber' | 'publicationCategory' | 'reviewStatus' | 'route' | 'source'
      > & {
        jurisdiction: documentType['decisionMetadata']['jurisdiction'];
        occultationBlock?: documentType['decisionMetadata']['occultationBlock'];
      };
      totalTreatmentDuration?: number;
      lastTreatmentDate?: number;
      statistic: {
        subAnnotationsNonSensitiveCount?: number;
        surAnnotationsCount?: number;
        subAnnotationsSensitiveCount?: number;
      };
      userNames: string[];
      humanTreatmentsCount?: number;
      humanTreatmentIds?: ObjectId[];
    }>([
      { $match: { status: 'done' } },
      lookupAssignations,
      lookupAssignedUsers,
      lookupTreatmentsSummaries,
      addHumanTreatments,
      {
        $set: {
          singleHumanTreatment: {
            $cond: [{ $eq: [{ $size: '$humanTreatments' }, 1] }, { $first: '$humanTreatments.treatment' }, null],
          },
        },
      },
      {
        $project: {
          _id: 0,
          document: {
            _id: '$_id',
            creationDate: '$creationDate',
            documentNumber: '$documentNumber',
            jurisdiction: '$decisionMetadata.jurisdiction',
            occultationBlock: '$decisionMetadata.occultationBlock',
            publicationCategory: '$publicationCategory',
            reviewStatus: '$reviewStatus',
            route: '$route',
            source: '$source',
          },
          ...humanTreatmentsSummary,
          statistic: {
            subAnnotationsNonSensitiveCount: '$singleHumanTreatment.subAnnotationsNonSensitiveCount',
            surAnnotationsCount: '$singleHumanTreatment.surAnnotationsCount',
            subAnnotationsSensitiveCount: '$singleHumanTreatment.subAnnotationsSensitiveCount',
          },
          humanTreatmentsCount: ifAssigned({ $size: '$humanTreatments' }),
          humanTreatmentIds: {
            $cond: [{ $gt: [{ $size: '$humanTreatments' }, 1] }, '$humanTreatments.treatment._id', '$$REMOVE'],
          },
        },
      },
    ])
    .toArray();
}

/** Publishable documents (filtered by the caller) flattened for the publication list */
export async function findPublishableDocuments(filter: Filter<documentType>) {
  return documents()
    .aggregate<
      Pick<documentType, '_id' | 'creationDate' | 'documentNumber' | 'publicationCategory' | 'route' | 'status'> & {
        appealNumber?: documentType['decisionMetadata']['appealNumber'];
        chamberName?: documentType['decisionMetadata']['chamberName'];
        jurisdiction: documentType['decisionMetadata']['jurisdiction'];
      }
    >([
      { $match: filter },
      {
        $project: {
          _id: 1,
          appealNumber: '$decisionMetadata.appealNumber',
          chamberName: '$decisionMetadata.chamberName',
          jurisdiction: '$decisionMetadata.jurisdiction',
          creationDate: 1,
          documentNumber: 1,
          publicationCategory: 1,
          route: 1,
          status: 1,
        },
      },
    ])
    .toArray();
}

/**
 * Documents with their assignations, assigned users and treatments
 * sorted by order. Throws if a document has no treatment.
 */
export async function findDocumentsWithTreatments<K extends keyof documentType = keyof documentType>(
  filter: Filter<documentType>,
  fields?: K[],
) {
  const documentsWithTreatments = await documents()
    .aggregate<documentWithAssignationsType<K> & { treatments: treatmentType[] }>([
      { $match: filter },
      ...projectFields(fields),
      lookupAssignations,
      lookupAssignedUsers,
      lookupTreatments,
    ])
    .toArray();

  documentsWithTreatments.forEach(({ _id, treatments }) => {
    if (treatments.length === 0) {
      throw new Error(`The document id ${_id.toHexString()} has no matching treatments`);
    }
  });
  return documentsWithTreatments;
}

/** Returns the updated document, or undefined if no document matched the filter */
export async function updateDocument(filter: Filter<documentType>, fields: Partial<documentType>) {
  return (await documents().findOneAndUpdate(filter, { $set: fields }, { returnDocument: 'after' })) ?? undefined;
}

export async function updateDocumentById(_id: ObjectId, fields: Partial<documentType>) {
  return updateDocument({ _id }, fields);
}

export async function deleteDocumentById(_id: ObjectId) {
  const { deletedCount } = await documents().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No documents with _id ${_id.toHexString()}`);
  }
}

const groupFilterValues = (jurisdiction: unknown) => ({
  $group: {
    _id: null,
    jurisdictions: { $addToSet: jurisdiction },
    publicationCategories: { $addToSet: '$publicationCategory' },
    routes: { $addToSet: '$route' },
    importers: { $addToSet: '$importer' },
    sources: { $addToSet: '$source' },
  },
});

/** Sorted union of the values of the documents and of the recent statistics, without empty values */
function mergeFilterValues(field: string, isArrayField = false) {
  const flatten = (input: unknown) =>
    isArrayField ? { $reduce: { input, initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } } : input;
  return {
    $sortArray: {
      input: {
        $filter: {
          input: {
            $setUnion: [flatten(`$${field}`), flatten({ $ifNull: [{ $first: `$recentStatistics.${field}` }, []] })],
          },
          cond: { $not: [{ $in: ['$$this', [null, '']] }] },
        },
      },
      sortBy: 1,
    },
  };
}

function extremumDate(operator: '$min' | '$max', field: 'minDate' | 'maxDate') {
  return {
    $ifNull: [
      { [operator]: [{ $first: `$statisticsDates.${field}` }, { $first: `$humanTreatmentsDates.${field}` }] },
      '$$REMOVE',
    ],
  };
}

/**
 * Values available for the statistic filters:
 * - lists: values of all the documents (lowercased jurisdictions) and of the statistics of the last 6 months
 * - dates: treatment dates of the statistics (of the documents sources) and of the human treatments
 * Undefined when there is no document.
 */
export async function findAvailableStatisticFilters() {
  const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;

  const [availableStatisticFilters] = await documents()
    .aggregate<{
      minDate?: number;
      maxDate?: number;
      jurisdictions: string[];
      publicationCategories: string[];
      routes: documentType['route'][];
      importers: documentType['importer'][];
      sources: documentType['source'][];
    }>([
      groupFilterValues({ $toLower: '$decisionMetadata.jurisdiction' }),
      {
        $lookup: {
          from: 'statistics',
          pipeline: [{ $match: { treatmentDate: { $gte: sixMonthsAgo } } }, groupFilterValues('$jurisdiction')],
          as: 'recentStatistics',
        },
      },
      {
        $lookup: {
          from: 'statistics',
          let: { sources: '$sources' },
          pipeline: [
            { $match: { $expr: { $in: ['$source', '$$sources'] } } },
            { $group: { _id: null, minDate: { $min: '$treatmentDate' }, maxDate: { $max: '$treatmentDate' } } },
          ],
          as: 'statisticsDates',
        },
      },
      {
        $lookup: {
          from: 'treatments',
          pipeline: [
            { $match: { source: { $in: ['annotator', 'admin'] } } },
            { $group: { _id: null, minDate: { $min: '$lastUpdateDate' }, maxDate: { $max: '$lastUpdateDate' } } },
          ],
          as: 'humanTreatmentsDates',
        },
      },
      {
        $project: {
          _id: 0,
          minDate: extremumDate('$min', 'minDate'),
          maxDate: extremumDate('$max', 'maxDate'),
          jurisdictions: mergeFilterValues('jurisdictions'),
          publicationCategories: mergeFilterValues('publicationCategories', true),
          routes: mergeFilterValues('routes'),
          importers: mergeFilterValues('importers'),
          sources: mergeFilterValues('sources'),
        },
      },
    ])
    .toArray();

  return availableStatisticFilters;
}
