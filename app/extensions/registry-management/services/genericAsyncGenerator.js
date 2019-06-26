import _ from 'lodash-es';

export default async function* genericAsyncGenerator($q, list, func, params) {
  const step = 100;
  let start = 0;
  let end = start + step;
  let results = [];
  while (start < list.length) {
    const batch = _.slice(list, start, end);
    const promises = [];
    for (let i = 0; i < batch.length; i++) {
      promises.push(func(...params, batch[i]));
    }
    yield start;
    const res = await $q.all(promises);
    for (let i = 0; i < res.length; i++) {
      results.push(res[i]);
    }
    start = end;
    end = start + step;
  }
  yield list.length;
  yield results;
}
