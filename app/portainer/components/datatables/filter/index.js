import controller from './datatable-filter.controller';

export const datatableFilter = {
  bindings: {
    labels: '<', // [{label, value}]
    state: '<', // [filterValue]
    filterKey: '@',
    onChange: '<',
  },
  controller,
  templateUrl: './datatable-filter.html',
  transclude: true,
};
