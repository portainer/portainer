/**
 * runs the provided promises in a sequence, and returns a promise that resolves when all promises have resolved
 *
 * @param promises a list of functions that return promises
 */
export function promiseSequence(promises: (() => Promise<unknown>)[]) {
  return promises.reduce(
    (promise, nextPromise) => promise.then(nextPromise),
    Promise.resolve(undefined as unknown)
  );
}

type AllSettledItems<T> = {
  fulfilledItems: T[];
  rejectedItems: { item: T; reason?: string }[];
};

/**
 * Separates a list of items into successful and rejected items based on the results of asynchronous operations.
 * This function is useful for deleting in parallel, or other requests where the response doesn't have much information.
 *
 * @template T - The type of the items in the list.
 * @param {T[]} items - The list of items to process.
 * @param {(item: T) => Promise<void>} asyncFn - An asynchronous function that takes the item and performs an operation on it.
 * @returns {Promise<AllSettledItems<T>>} - A promise that resolves to an object containing arrays of successful and rejected items.
 */
export async function getAllSettledItems<T>(
  items: T[],
  asyncFn: (item: T) => Promise<void>
): Promise<AllSettledItems<T>> {
  const results = await Promise.allSettled(items.map((item) => asyncFn(item)));

  // make an array of successful items and an array of rejected items
  const separatedItems = results.reduce<AllSettledItems<T>>(
    (acc, result, index) => {
      if (result.status === 'fulfilled') {
        acc.fulfilledItems.push(items[index]);
      } else {
        const reason =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        acc.rejectedItems.push({ item: items[index], reason });
      }
      return acc;
    },
    { fulfilledItems: [], rejectedItems: [] }
  );

  return separatedItems;
}

export function isFulfilled<T>(
  result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

export function isRejected<T>(
  result: PromiseSettledResult<T>
): result is PromiseRejectedResult {
  return result.status === 'rejected';
}

export function getFulfilledResults<T>(
  results: Array<PromiseSettledResult<T>>
) {
  return results.filter(isFulfilled).map((result) => result.value);
}
