/**
 * runs the provided promises in a sequence, and returns a promise that resolves when all promises have resolved
 *
 * @param promises a list of functions that return promises
 */
export function promiseSequence<T>(promises: (() => Promise<T>)[]) {
  return promises.reduce(
    (promise, nextPromise) => promise.then(() => nextPromise()),
    Promise.resolve<T>(undefined as unknown as T)
  );
}
