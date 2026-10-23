export function buildProjection<T>(fields: Array<keyof T>) {
  return Object.fromEntries(fields.map((field) => [field, 1])) as Record<keyof T, 1>;
}
