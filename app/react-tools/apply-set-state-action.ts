import { SetStateAction } from 'react';

export function applySetStateAction<T>(applier: SetStateAction<T>, values: T) {
  if (isFunction(applier)) {
    return applier(values);
  }
  return applier;

  function isFunction(value: unknown): value is (prevState: T) => T {
    return typeof value === 'function';
  }
}
