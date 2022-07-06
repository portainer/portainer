import angular from 'angular';
import 'angular-utils-pagination';

import { datatableTitlebar } from './titlebar';
import { datatableSortIcon } from './sort-icon';
import { datatablePagination } from './pagination';
import { datatableFilter } from './filter';

export default angular
  .module('portainer.shared.datatable', ['angularUtils.directives.dirPagination'])
  .component('datatableTitlebar', datatableTitlebar)
  .component('datatableSortIcon', datatableSortIcon)
  .component('datatablePagination', datatablePagination)
  .component('datatableFilter', datatableFilter).name;
