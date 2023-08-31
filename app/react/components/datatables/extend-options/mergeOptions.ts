import { TableOptions } from '@tanstack/react-table';

type OptionExtender<T> = (options: TableOptions<T>) => TableOptions<T>;

export function mergeOptions<T>(
  ...extenders: Array<OptionExtender<T>>
): OptionExtender<T> {
  return (options: TableOptions<T>) =>
    extenders.reduce((acc, option) => option(acc), options);
}
