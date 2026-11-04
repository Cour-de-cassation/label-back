/** Consume an async iterable (e.g. a cursor) by batches, without loading everything in memory */
export async function forEachBatch<T>(
  iterable: AsyncIterable<T>,
  handler: (batch: T[]) => Promise<void>,
  batchSize = 1000,
) {
  let batch: T[] = [];
  let count = 0;
  for await (const item of iterable) {
    batch.push(item);
    if (batch.length === batchSize) {
      await handler(batch);
      count += batch.length;
      batch = [];
    }
  }
  if (batch.length > 0) {
    await handler(batch);
    count += batch.length;
  }
  return count;
}
