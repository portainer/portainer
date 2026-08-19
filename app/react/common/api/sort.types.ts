import { compact } from 'lodash';

import { SortableTableSettings } from '@@/datatables/types';

export type SortOptions = readonly string[];
export type SortType<T extends SortOptions> = T[number];

/**
 * Used to generate the validation function that allows to check if the sort key is supported or not
 *
 * **Example**
 *
 * ```ts
 * export const sortOptions: SortOptions = ['Id', 'Name'] as const;
 * export const isSortType = makeIsSortTypeFunc(sortOptions)
 * ```
 *
 * **Usage**
 *
 * ```ts
 * // react-query hook definition
 * export function useSomething({ sort, order }: SortQuery<typeof sortOptions>) { ... }
 *
 * // component using the react-query hook, validating the parameters used by the query
 * function MyComponent() {
 *   const tableState = useTableState(settingsStore, tableKey);
 *   const { data } = useSomething(
 *     {
 *       sort: isSortType(tableState.sortBy.id) ? tableState.sortBy.id : undefined,
 *       order: tableState.sortBy.desc ? 'desc' : 'asc',
 *     },
 *   );
 *   ...
 * }
 * ```
 *
 * @param sortOptions list of supported keys
 * @returns validation function
 */
export function makeIsSortTypeFunc<T extends SortOptions>(sortOptions: T) {
  return (value?: string): value is SortType<T> =>
    sortOptions.includes(value as SortType<T>);
}

/**
 * Used to define axios query functions parameters for queries that support backend sorting
 *
 * **Example**
 *
 * ```ts
 *  const sortOptions: SortOptions = ['Id', 'Name'] as const; // or generated with `sortOptionsFromColumns`
 *  type QueryParams = SortQueryParams<typeof sortOptions>;
 *
 *  async function getSomething({ sort, order = 'asc' }: QueryParams = {}) {
 *    try {
 *      const { data } = await axios.get<APIType>(
 *        buildUrl(),
 *        { params: { sort, order } },
 *      );
 *      return data;
 *    } catch (err) {
 *      throw parseAxiosError(err as Error, 'Unable to retrieve something');
 *    }
 *  }
 *```
 */
export type SortQueryParams<T extends SortOptions> = {
  sort?: SortType<T>;
  order?: 'asc' | 'desc';
};

/**
 * Used to define react-query query functions parameters for queries that support backend sorting
 *
 * Example:
 *
 * ```ts
 *  const sortOptions: SortOptions = ['Id', 'Name'] as const;
 *  type Query = SortQuery<typeof sortOptions>;
 *
 *  function useSomething({
 *    sort,
 *    order = 'asc',
 *    ...query
 *  }: Query = {}) {
 *    return useQuery(
 *      [ ...queryKeys.base(), { ...query, sort, order } ],
 *      async () => getSomething({ ...query, sort, order }),
 *      {
 *        ...withError('Failure retrieving something'),
 *      }
 *    );
 *  }
 * ```
 */
export type SortQuery<T extends SortOptions> = {
  sort?: SortType<T>;
  order?: 'asc' | 'desc';
};

/**
 * Utility function to convert react-table `sortBy` state to `SortQuery` query parameter
 *
 * @param sortBy tableState.sortBy
 * @param sortOptions SortOptions - either defined manually, or generated with `sortOptionsFromColumns`
 * @returns SortQuery - object usable by react-query functions that have params extending SortQuery
 */
export function withSortQuery<T extends SortOptions>(
  sortBy: SortableTableSettings['sortBy'],
  sortOptions: T
): SortQuery<T> {
  if (!sortBy) {
    return {
      sort: undefined,
      order: 'asc',
    };
  }

  const isSortType = makeIsSortTypeFunc(sortOptions);
  return {
    sort: isSortType(sortBy.id) ? sortBy.id : undefined,
    order: sortBy.desc ? 'desc' : 'asc',
  };
}

/**
 * Utility function to generate SortOptions from columns definitions
 * @param columns Column-like objects { id?:string; enableSorting?:boolean } to extract SortOptions from
 * @returns SortOptions
 */
export function sortOptionsFromColumns(
  columns: { id?: string; enableSorting?: boolean; accessorKey?: string }[]
): SortOptions {
  return compact(
    columns.map((c) =>
      c.enableSorting === false ? undefined : (c.id ?? c.accessorKey)
    )
  );
}
