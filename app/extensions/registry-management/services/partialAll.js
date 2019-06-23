import _ from 'lodash-es';

export default async function* partialAll(promises) {
  let output = null;
  const pool = new Set(promises);

  _.forEach(promises, (promise) => {
    promise.then(value => {
      output = value;
      pool.delete(promise);
    });
  });

  while (pool.size !== 0) {
    await Promise.race(pool);
    yield output;
  }
}

/**
 * EXAMPLE OF USAGE
 * async function() {
 *  const promises = [...]; // ARRAY OF PROMISES
 *  for await (const partialResult of partialAll(promises)) {
 *    // partialResult one of remaining promises
 *  }
*/