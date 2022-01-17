export function arrayMove<T>(array: Array<T>, from: number, to: number) {
  if (!checkValidIndex(array, from) || !checkValidIndex(array, to)) {
    throw new Error('index is out of bounds');
  }

  const item = array[from];
  const { length } = array;

  const diff = from - to;

  if (diff > 0) {
    // move left
    return [
      ...array.slice(0, to),
      item,
      ...array.slice(to, from),
      ...array.slice(from + 1, length),
    ];
  }

  if (diff < 0) {
    // move right
    const targetIndex = to + 1;
    return [
      ...array.slice(0, from),
      ...array.slice(from + 1, targetIndex),
      item,
      ...array.slice(targetIndex, length),
    ];
  }

  return [...array];

  function checkValidIndex<T>(array: Array<T>, index: number) {
    return index >= 0 && index <= array.length;
  }
}
