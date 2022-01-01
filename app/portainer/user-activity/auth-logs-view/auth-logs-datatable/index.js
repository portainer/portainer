import controller from './auth-logs-datatable.controller';

export const authLogsDatatable = {
  templateUrl: './auth-logs-datatable.html',
  controller,
  bindings: {
    logs: '<',
    keyword: '<',
    sort: '<',
    limit: '<',
    totalItems: '<',
    currentPage: '<',
    contextFilter: '<',
    typeFilter: '<',
    feature: '@',

    onChangeContextFilter: '<',
    onChangeTypeFilter: '<',
    onChangeKeyword: '<',
    onChangeSort: '<',

    onChangeLimit: '<',
    onChangePage: '<',
  },
};
