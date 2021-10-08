import controller from './datatable-sort-icon.controller';

export const datatableSortIcon = {
  bindings: {
    key: '@',
    selectedSortKey: '@',
    reverseOrder: '<',
  },
  controller,
  templateUrl: './datatable-sort-icon.html',
};
