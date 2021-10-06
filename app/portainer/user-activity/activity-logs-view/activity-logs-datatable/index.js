import './activity-logs-datatable.css';

import controller from './activity-logs-datatable.controller.js';

export const activityLogsDatatable = {
  templateUrl: './activity-logs-datatable.html',
  controller,
  bindings: {
    logs: '<',
    keyword: '<',
    sort: '<',
    limit: '<',
    totalItems: '<',
    currentPage: '<',
    feature: '@',

    onChangeContextFilter: '<',
    onChangeKeyword: '<',
    onChangeSort: '<',

    onChangeLimit: '<',
    onChangePage: '<',
  },
};
