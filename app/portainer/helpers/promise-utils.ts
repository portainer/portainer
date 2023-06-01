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
