/* eslint-disable @typescript-eslint/no-explicit-any */
// required `any` for Distributive Conditional
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types

/**
 * Remove the first element (allows to move forward path-arrays)
 */
export type Shift<T extends any[]> = ((...t: T) => any) extends (
  first: any,
  ...rest: infer Rest
) => any
  ? Rest
  : never;

/**
 * Using Distributive Conditional, allows to move forward on union of path-arrays
 *
 * @example
 * type Result = ShiftUnion<['a', 'b'] | ['c', 'd']> // ['b'] | ['d']
 */
export type ShiftUnion<P extends PropertyKey, T extends any[]> = T extends any[]
  ? T[0] extends P
    ? Shift<T>
    : never
  : never;

/* eslint-enable @typescript-eslint/no-explicit-any */
