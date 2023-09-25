import _ from 'lodash';
import { AnySchema, TestContext, TypeOf, ValidationError } from 'yup';
import Lazy from 'yup/lib/Lazy';
import { AnyObject } from 'yup/lib/types';

/**
 * Builds a uniqueness test for yup.
 * @param errorMessage The error message to display for duplicates.
 * @param path The path to the value to test for uniqueness (if the list item is an object).
 * @returns A function that can be passed to yup's `test` method.
 */
export function buildUniquenessTest<
  T extends AnySchema | Lazy<AnySchema, AnySchema>,
>(errorMessage: (errorIndex: number) => string, path = '') {
  return (
    list: Array<TypeOf<T>> | undefined,
    testContext: TestContext<AnyObject>
  ) => {
    if (!list) {
      return true;
    }

    const values = list.map(mapper);

    // check for duplicates, adding the index of each duplicate to an array
    const seen = new Set<TypeOf<T>>();
    const duplicates: number[] = [];
    values.forEach((value, i) => {
      if (seen.has(value)) {
        duplicates.push(i);
      } else {
        seen.add(value);
      }
    });

    // create an array of yup validation errors for each duplicate
    const errors = duplicates.map((i) => {
      const error = new ValidationError(
        errorMessage(i),
        list[i],
        `${testContext.path}[${i}]${path}`
      );
      return error;
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return true;
  };

  function mapper(a: TypeOf<T>) {
    return path ? _.get(a, path) : a;
  }
}
