import angular from 'angular';

import controller from './datatable-columns-visibility.controller';

angular.module('portainer.app').component('datatableColumnsVisibility', {
  templateUrl: './datatable-columns-visibility.html',
  controller,
  bindings: {
    columns: '<',
    onChange: '<',
  },
});
