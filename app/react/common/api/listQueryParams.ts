import { BasicTableSettings } from '@@/datatables/types';
import { TableState } from '@@/datatables/useTableState';

import {
  PaginationQuery,
  PaginationQueryParams,
  withPaginationQueryParams,
} from './pagination.types';
import { SearchQuery, SearchQueryParams } from './search.types';
import {
  SortOptions,
  SortQuery,
  SortQueryParams,
  withSortQuery,
} from './sort.types';

export type BaseQueryOptions<T extends SortOptions> = SearchQuery &
  SortQuery<T> &
  PaginationQuery;

/**
 * Utility function to transform a TableState (base form) to a query options object
 * Used to unify backend pagination common cases
 *
 * @param tableState TableState {search, sortBy: {id:string, desc:bool }, page, pageSize}
 * @param sortOptions SortOptions (generated from columns)
 * @returns BaseQuery {search, sort, order, page, pageLimit}
 */
export function queryOptionsFromTableState<T extends SortOptions>(
  tableState: TableState<BasicTableSettings> & { page: number },
  sortOptions: T
): BaseQueryOptions<T> {
  return {
    // search/filter
    search: tableState.search,
    // sorting
    ...withSortQuery(tableState.sortBy, sortOptions),
    // pagination
    page: tableState.page,
    pageLimit: tableState.pageSize,
  };
}

export type BaseQueryParams<T extends SortOptions> = SearchQueryParams &
  SortQueryParams<T> &
  PaginationQueryParams;

/**
 *
 * @param query BaseQueryOptions
 * @returns BaseQueryParams {search, sort, order, start, limit}
 */
export function queryParamsFromQueryOptions<T extends SortOptions>(
  query: BaseQueryOptions<T>
): BaseQueryParams<T> {
  return {
    // search/filter
    search: query.search,
    // sorting
    sort: query.sort,
    order: query.order,
    // paginattion
    ...withPaginationQueryParams(query),
  };
}
