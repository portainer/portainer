angular.module('ui').component('datatableAction', {
  require: {
    datatable: '^^datatable'
  },
  template: '<button type="button" class="btn btn-sm" ng-class="$ctrl.btnStyle" ng-click="$ctrl.action({items: $ctrl.datatable.state.selectedItems})"><i class="fa space-right" ng-class="$ctrl.btnIcon" aria-hidden="true"></i>{{ $ctrl.btnTitle }}</button>',
  bindings: {
    btnStyle: '@',
    btnIcon: '@',
    btnTitle: '@',
    action: '&'
  }
});
