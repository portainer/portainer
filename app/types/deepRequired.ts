import { ShiftUnion } from './shift';
import { PathToStringArray, Prettify } from './utils';

/**
 * Recursively make all paths (or path-arrays) required
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
 * type DeepRequiredExampleArray = DeepRequired<Example, 'a.b.c' | 'one.two.three'>;
 * type DeepRequiredExampleString = DeepRequired<Example, ['a', 'b', 'c'] | ['one', 'two', 'three']>;
 * type DeepRequiredExampleMix = DeepRequired<Example, 'a.b.c' | ['one', 'two', 'three']>;
 *
 * // they all equal to
 * type ResultingType = {
 *   always: string;
 *   a: { // became required
 *     two?: boolean | undefined;
 *     b: { // became required
 *       c: number; // deep required
 *     };
 *   };
 *   one: { // became required
 *     two: { // became required
 *       four?: number | undefined;
 *       three: { // deep required
 *         something: number;
 *       };
 *     };
 *   };
 * };
 *
 */
export type DeepRequired<T, P extends string[] | string> = Prettify<
  DeepRequiredRec<T, P extends string ? PathToStringArray<P> : P>
>;

/**
 * Recursively require all elements of path-array
 * The Omit part is there to make the key a hard require
 */
type DeepRequiredRec<T, P extends string[]> = T extends object
  ? Omit<T, Extract<keyof T, P[0]>> &
      Required<{
        [K in Extract<keyof T, P[0]>]: NonNullable<
          DeepRequiredRec<T[K], ShiftUnion<K, P>>
        >;
      }>
  : T;
