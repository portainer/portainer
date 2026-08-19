/**
 * Used to define axios query functions parameters for queries that support backend filtering by search
 *
 * **Example**
 *
 * ```ts
 *  type QueryParams = SearchQueryParams;
 *
 *  async function getSomething({ search }: QueryParams = {}) {
 *    try {
 *      const { data } = await axios.get<APIType>(
 *        buildUrl(),
 *        { params: { search } },
 *      );
 *      return data;
 *    } catch (err) {
 *      throw parseAxiosError(err as Error, 'Unable to retrieve something');
 *    }
 *  }
 *```
 */
export type SearchQueryParams = {
  search?: string;
};

/**
 * Used to define react-query query functions parameters for queries that support backend filtering by search
 *
 * Example:
 *
 * ```ts
 * type Query = SearchQuery;
 *
 * function useSomething({ search, ...query }: Query = {}) {
 *   return useQuery(
 *     [ ...queryKeys.base(), { search, ...query } ],
 *     async () => getSomething({ search, ...query }),
 *     {
 *       ...withError('Failure retrieving something'),
 *     }
 *   );
 * }
 * ```
 */
export type SearchQuery = {
  search?: string;
};
