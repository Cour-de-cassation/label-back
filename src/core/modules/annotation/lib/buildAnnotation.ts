import { entityIdHandler } from './entityIdHandler';

export { buildAnnotation };

function buildAnnotation({
  category,
  start,
  text,
  score,
  entityId,
  source,
}: {
  category: string;
  start: number;
  text: string;
  score: number | null | undefined;
  entityId?: string;
  source: string | null | undefined;
}) {
  return {
    category,
    entityId: entityId ?? entityIdHandler.compute(category, text),
    start,
    text,
    score,
    source: source,
  };
}
