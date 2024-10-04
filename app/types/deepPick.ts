import { DeepRequired } from './deepRequired';
import { Shift } from './shift';
import { ToTuple } from './toTuple';
import { PathToStringArray, Prettify } from './utils';

/**
 * Pick and union the types of the paths (or path-arrays).
 *
 * To be able to properly pick, it marks all segments of the paths required, even the last.
 *
 * The resulting type will never be optional
 *
 * @example
 * type SubExample = {
 *   something: number;
 * };
 *
 * type Example = {
 *   always: string;
 *   a?: {
 *     two?: boolean;
 *     b?: {
 *       c?: number;
 *     };
 *   };
 *
 *   one?: {
 *     two?: {
 *       three?: SubExample;
 *       four?: number;
 *     };
 *   };
 * };
 *
 * type DeepPickExampleArray = DeepPick<Example, ['a', 'b', 'c'] | ['one', 'two', 'three'] | ['a', 'two']>;
 * type DeepPickExampleString = DeepPick<Example, 'a.b.c' | 'one.two.three' | 'a.two'>;
 * type DeepPickExampleMix = DeepPick<Example, 'a.b.c' | ['one', 'two', 'three'] | 'a.two'>;
 *
 * // they all equal to
 * type ResultingType =
 *   | number // picked from 'a.b.c'
 *   | boolean // picked from 'a.two'
 *   | { something: number }; // picked from 'one.two.three'
 *
 */
export type DeepPick<T extends object, P extends string | string[]> = Prettify<
  P extends string
    ? DeepPickFromString<DeepRequired<T, P>, P>
    : P extends string[]
    ? DeepPickFromArray<DeepRequired<T, P>, P>
    : never
>;

/**
 * DeepPick and transform union of paths to union of path-arrays
 * from `'a.b.c' | 'c.d.e'` to `['a', 'b', 'c'] | ['c' | 'd' | 'e']`
 */
type DeepPickFromString<T extends object, P extends string> = DeepPickFromArray<
  T,
  PathToStringArray<P>
>;

/**
 * Transform union of path-arrays to tuple of path-arrays
 * from `['a', 'b', 'c'] | ['c' | 'd' | 'e']` to `[['a', 'b', 'c'], ['c' | 'd' | 'e']]`
 */
type DeepPickFromArray<
  T extends object,
  P extends string[],
> = ToTuple<P> extends string[][] ? DeepPickRec<T, ToTuple<P>> : never;

// Recursively pick each path-array of tuple and union the resulting types
type DeepPickRec<T extends object, P extends string[][]> = P[0] extends string[]
  ? PickOne<T, P[0]> | DeepPickRec<T, Shift<P>>
  : never;

// Recursively pick each element of path-array
type PickOne<T extends object, P extends string[]> = P[0] extends keyof T
  ? T[P[0]] extends object
    ? PickOne<T[P[0]], Shift<P>>
    : T[P[0]]
  : T;
