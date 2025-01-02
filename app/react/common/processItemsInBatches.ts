/**
 * Type definition for the callback function used in processItemsInBatches.
 * It should accept an item from the array as its first argument
 * and additional arguments (if any) as its second argument, and should return a Promise.
 */
type ProcessItemsCallback<T, Args extends never[]> = (
  item: T,
  ...args: Args
) => Promise<void>;

/**
 * Asynchronously processes an array of items in batches.
 * @param items An array of items to be processed.
 * @param processor A callback function of type ProcessItemsCallback that will be called for each item in the array.
 * @param batchSize The maximum number of items to process in each batch. Defaults to 100 if not provided.
 * @param args Additional arguments to be passed to the callback function for each item.
 */
export async function processItemsInBatches<T, Args extends never[]>(
  items: T[],
  processor: ProcessItemsCallback<T, Args>,
  batchSize = 100,
  ...args: Args
): Promise<void> {
  while (items.length) {
    const batch = items.splice(0, batchSize);
    const batchPromises = batch.map((item) => processor(item, ...args));

    await Promise.all(batchPromises);
  }
}
