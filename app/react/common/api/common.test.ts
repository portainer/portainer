import {
  queryOptionsFromTableState,
  queryParamsFromQueryOptions,
} from './listQueryParams';
import {
  withPaginationHeaders,
  withPaginationQueryParams,
} from './pagination.types';
import {
  makeIsSortTypeFunc,
  sortOptionsFromColumns,
  withSortQuery,
} from './sort.types';

const sortOptions = sortOptionsFromColumns([
  { enableSorting: true },
  { id: 'one' },
  { id: 'two', enableSorting: true },
  { accessorKey: 'three', enableSorting: true },
  { id: 'four', enableSorting: true, accessorKey: 'four_key' },
]);

describe('listQueryParams', () => {
  test('queryOptionsFromTableState', () => {
    const fns = {
      setPageSize: () => {},
      setSearch: () => {},
      setSortBy: () => {},
    };

    expect(
      queryOptionsFromTableState(
        {
          page: 5,
          pageSize: 10,
          search: 'something',
          sortBy: { id: 'one', desc: false },
          ...fns,
        },
        sortOptions
      )
    ).toStrictEqual({
      search: 'something',
      sort: 'one',
      order: 'asc',
      page: 5,
      pageLimit: 10,
    });
  });

  test('queryParamsFromQueryOptions', () => {
    expect(
      queryParamsFromQueryOptions({
        search: 'something',
        page: 5,
        pageLimit: 10,
        sort: 'one',
        order: 'asc',
      })
    ).toStrictEqual({
      search: 'something',
      sort: 'one',
      order: 'asc',
      start: 50,
      limit: 10,
    });
  });
});

describe('pagination.types', () => {
  test('withPaginationQueryParams', () => {
    expect(withPaginationQueryParams({ page: 5, pageLimit: 10 })).toStrictEqual(
      {
        start: 50,
        limit: 10,
      }
    );
  });

  test('withPaginationHeaders', () => {
    expect(
      withPaginationHeaders({
        data: [],
        headers: { 'x-total-count': 10, 'x-total-available': 100 },
      })
    ).toStrictEqual({
      data: [],
      totalCount: 10,
      totalAvailable: 100,
    });
  });
});

describe('sort.types', () => {
  test('makeIsSortType', () => {
    const isSortType = makeIsSortTypeFunc(sortOptions);
    expect(typeof isSortType).toBe('function');
    expect(isSortType('one')).toBe(true);
    expect(isSortType('something_else')).toBe(false);
  });

  test('withSortQuery', () => {
    expect(
      withSortQuery({ id: 'one', desc: false }, sortOptions)
    ).toStrictEqual({ sort: 'one', order: 'asc' });
    expect(
      withSortQuery({ id: 'three', desc: true }, sortOptions)
    ).toStrictEqual({ sort: 'three', order: 'desc' });
    expect(
      withSortQuery({ id: 'something_else', desc: true }, sortOptions)
    ).toStrictEqual({ sort: undefined, order: 'desc' });
  });

  test('sortOptionsFromColumns', () => {
    expect(sortOptions).toEqual(['one', 'two', 'three', 'four']);
  });
});
