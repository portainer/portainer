import _ from 'lodash-es';

function findBestStep(length) {
  let step = Math.trunc(length / 10);
  if (step < 10) {
    step = 10;
  } else if (step > 100) {
    step = 100;
  }
  return step;
}

export default async function* genericAsyncGenerator($q, list, func, params) {
  const step = findBestStep(list.length);
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
    end += step;
  }
  yield list.length;
  yield results;
}
