export function filterParam(defaultValue = null) {
  return { value: defaultValue, squash: true, dynamic: true };
}

export function paginationParams(defaultSort = 'name') {
  return {
    search: filterParam(),
    sort: filterParam(defaultSort),
    order: filterParam('asc'),
    page: filterParam('0'),
    pageSize: filterParam(),
  };
}
