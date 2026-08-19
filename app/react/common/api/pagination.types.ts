import { AxiosResponse } from 'axios';

/**
 * Used to define axios query functions parameters for queries that support backend pagination
 *
 * **Example**
 *
 * ```ts
 *  type QueryParams = PaginationQueryParams;
 *
 *  async function getSomething({ start, limit }: QueryParams = {}) {
 *    try {
 *      const { data } = await axios.get<APIType>(
 *        buildUrl(),
 *        { params: { start, limit } },
 *      );
 *      return data;
 *    } catch (err) {
 *      throw parseAxiosError(err as Error, 'Unable to retrieve something');
 *    }
 *  }
 *```
 */
export type PaginationQueryParams = {
  start?: number;
  limit?: number;
};

/**
 * Used to define react-query query functions parameters for queries that support backend pagination
 *
 * Example:
 *
 * ```ts
 * type Query = PaginationQuery;
 *
 * function useSomething({
 *    page = 0,
 *    pageLimit = 10,
 *    ...query
 *   }: Query = {}) {
 *     return useQuery(
 *     [ ...queryKeys.base(), { page, pageLimit, ...query } ],
 *     async () => {
 *       const start = (page - 1) * pageLimit + 1;
 *       return getSomething({ start, limit: pageLimit, ...query });
 *     },
 *     {
 *       ...withError('Failure retrieving something'),
 *     }
 *   );
 * }
 * ```
 */
export type PaginationQuery = {
  page?: number;
  pageLimit?: number;
};

/**
 * Utility function to convert PaginationQuery to PaginationQueryParams
 *
 * **Example**
 *
 * ```ts
 * function getSomething(params: PaginationQueryParams) {...}
 *
 * function useSomething(query: PaginationQuery) {
 *   return useQuery(
 *     [ ...queryKeys.base(), query ],
 *     async () => getSomething({ ...query, ...withPaginationQueryParams(query) })
 *   )
 * }
 * ```
 */
export function withPaginationQueryParams({
  page = 0,
  pageLimit = 10,
}: PaginationQuery): PaginationQueryParams {
  const start = page * pageLimit;
  return {
    start,
    limit: pageLimit,
  };
}

export type PaginatedResults<T> = {
  data: T | null;
  totalCount: number;
  totalAvailable: number;
};

/**
 * Utility function to extract total count from AxiosResponse headers
 *
 * @param param0 AxiosReponse-like object {data, headers}
 * @returns PaginatedResults {data, totalCount, totalAvailable}
 */
export function withPaginationHeaders<T = unknown>({
  data,
  headers,
}: {
  data: AxiosResponse<T>['data'];
  headers: AxiosResponse<T>['headers'];
}): PaginatedResults<T> {
  const totalCount = parseInt(headers['x-total-count'], 10);
  const totalAvailable = parseInt(headers['x-total-available'], 10);

  return {
    data,
    totalCount,
    totalAvailable,
  };
}
