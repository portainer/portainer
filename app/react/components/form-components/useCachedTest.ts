import { useRef } from 'react';
import { TestContext, TestFunction } from 'yup';

function cacheTest<T, TContext>(
  asyncValidate: TestFunction<T, TContext>
): TestFunction<T, TContext> {
  let valid = true;
  let value: T | undefined;

  return async (newValue: T, context: TestContext<TContext>) => {
    if (newValue !== value) {
      value = newValue;

      const response = await asyncValidate.call(context, newValue, context);
      valid = !!response;
    }
    return valid;
  };
}

export function useCachedValidation<T, TContext>(
  test: TestFunction<T, TContext>
) {
  const ref = useRef(cacheTest(test));

  return ref.current;
}
