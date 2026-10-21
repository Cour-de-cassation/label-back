import { Filter, ObjectId } from 'mongodb';
import { documentType, problemReportType, userType } from '@src/core';
import { mongo } from '../../utils';

const problemReports = () => mongo.getDb().collection<problemReportType>('problemReports');

export async function insertProblemReport(problemReport: problemReportType) {
  await problemReports().insertOne(problemReport);
}

export async function findProblemReports(filter: Filter<problemReportType> = {}) {
  return problemReports().find(filter).toArray();
}

export async function countProblemReports(filter: Filter<problemReportType> = {}) {
  return problemReports().countDocuments(filter);
}

export async function updateProblemReportById(_id: ObjectId, fields: Partial<problemReportType>) {
  await problemReports().updateOne({ _id }, { $set: fields });
}

export async function deleteProblemReportById(_id: ObjectId) {
  const { deletedCount } = await problemReports().deleteOne({ _id });
  if (deletedCount !== 1) {
    throw new Error(`No problemReports with _id ${_id.toHexString()}`);
  }
}

export async function deleteProblemReports(filter: Filter<problemReportType>) {
  await problemReports().deleteMany(filter);
}

/** Problem reports with the reported document and the reporting user, skipped if one of them does not exist anymore */
export async function findProblemReportsWithDetails() {
  return problemReports()
    .aggregate<{
      problemReport: problemReportType;
      user: Pick<userType, 'email' | 'name'>;
      document: Pick<documentType, '_id' | 'documentNumber' | 'source' | 'publicationCategory' | 'route' | 'status'> & {
        jurisdiction: documentType['decisionMetadata']['jurisdiction'];
        appealNumber?: documentType['decisionMetadata']['appealNumber'];
      };
    }>([
      { $replaceWith: { problemReport: '$$ROOT' } },
      {
        $lookup: {
          from: 'documents',
          localField: 'problemReport.documentId',
          foreignField: '_id',
          as: 'document',
          pipeline: [
            {
              $project: {
                documentNumber: 1,
                source: 1,
                jurisdiction: '$decisionMetadata.jurisdiction',
                appealNumber: '$decisionMetadata.appealNumber',
                publicationCategory: 1,
                route: 1,
                status: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'problemReport.userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { _id: 0, email: 1, name: 1 } }],
        },
      },
      { $unwind: '$document' },
      { $unwind: '$user' },
    ])
    .toArray();
}
