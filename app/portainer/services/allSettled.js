import _ from 'lodash-es';

/**
 *
 * @param {any[]} promises
 */
export default async function $allSettled(promises) {
  const res = {
    fulfilled: [],
    rejected: [],
  };
  const data = await Promise.allSettled(promises);
  res.fulfilled = _.reduce(
    data,
    (acc, item) => {
      if (item.status === 'fulfilled') {
        acc.push(item.value);
      }
      return acc;
    },
    []
  );
  res.rejected = _.reduce(
    data,
    (acc, item) => {
      if (item.status === 'rejected') {
        acc.push(item.reason);
      }
      return acc;
    },
    []
  );
  return res;
}
