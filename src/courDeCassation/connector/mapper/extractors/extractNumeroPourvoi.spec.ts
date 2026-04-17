import { extractNumeroPourvoi } from './extractNumeroPourvoi';

describe('extractNumeroPourvoi', () => {
  it('should extract pourvoi for Cour de cassation document and format it', () => {
    const regsiterNumber = extractNumeroPourvoi('Cour de cassation', 's1122333');

    expect(regsiterNumber).toBe('11-22.333');
  });

  it('should return raw appeal number for other courts', () => {
    const regsiterNumber = extractNumeroPourvoi("Cour d'appel de Rennes", '19/000101');

    expect(regsiterNumber).toBe('19/000101');
  });
});
