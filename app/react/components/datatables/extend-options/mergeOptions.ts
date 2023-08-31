export function mergeOptions<T>(...options: T[]) {
  return options.reduce(
    (acc, option) => ({
      ...acc,
      ...option,
    }),
    {} as T
  );
}
