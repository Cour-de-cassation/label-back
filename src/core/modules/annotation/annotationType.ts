export type annotationType = {
  category: string;
  entityId: string;
  start: number;
  text: string;
  score: number | null | undefined;
  source: string | null | undefined;
};
