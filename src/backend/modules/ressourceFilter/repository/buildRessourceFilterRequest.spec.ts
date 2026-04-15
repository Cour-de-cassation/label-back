import { dateBuilder, ressourceFilterModule } from '@src/core';
import { buildRessourceFilterRequest } from './buildRessourceFilterRequest';
import { ObjectId } from 'mongodb';

describe('buildRessourceFilterRequest', () => {
  it('should build a mongo request according to the given ressource filter', async () => {
    const publicationCategory = 'P';
    const source = 'SOURCE';
    const jurisdiction = 'JURISDICTION';
    const route = 'simple';
    const startDate = dateBuilder.daysAgo(0);
    const endDate = dateBuilder.daysAgo(1);
    const userId = new ObjectId();
    const ressourceFilter = ressourceFilterModule.generator.generate({
      mustHaveSurAnnotations: true,
      mustHaveSubAnnotations: true,
      publicationCategory,
      jurisdiction,
      route,
      source,
      startDate,
      endDate,
      userId,
    });

    const ressourceFilterRequest = buildRessourceFilterRequest(ressourceFilter);

    expect(ressourceFilterRequest).toEqual({
      surAnnotationsCount: { $gt: 0 },
      subAnnotationsSensitiveCount: { $gt: 0 },
      publicationCategory: [publicationCategory],
      route,
      source,
      treatmentDate: {
        $gt: startDate,
        $lte: endDate,
      },
      jurisdiction,
      'treatmentsSummary.userId': userId,
    });
  });
});
