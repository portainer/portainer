angular.module('ui').component('datatableActions', {
  transclude: true,
  require: {
    datatable: '^^datatable'
  },
  template: '<div class="actionBar" ng-if="$ctrl.datatable.state.selectedItemCount !== 0" ng-transclude></div>'
});
