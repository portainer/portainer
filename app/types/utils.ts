/**
 * Transform `'a.b.c'` or `['a', 'b', 'c']` to `['a', 'b', 'c']`
 */
export type PathToStringArray<T extends string | string[]> = T extends string[]
  ? T
  : T extends `${infer Head}.${infer Tail}`
  ? [...PathToStringArray<Head>, ...PathToStringArray<Tail>]
  : [T];

/* eslint-disable @typescript-eslint/ban-types */
/**
 * VSCode helper to recursively pretty print the constructed types instead of
 * displaying the sub types.
 *
 * Particularly useful to see the resulting type when using `DeepRequired` and `DeepPick`.
 * Both already use them at root.
 */
export type Prettify<T> = {
  [K in keyof T]: Prettify<T[K]>;
} & {};
/* eslint-enable @typescript-eslint/ban-types */
