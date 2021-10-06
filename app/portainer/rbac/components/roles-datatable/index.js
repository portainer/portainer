import controller from './roles-datatable.controller';
import './roles-datatable.css';

export const rolesDatatable = {
  templateUrl: './roles-datatable.html',
  controller,
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
  },
};
