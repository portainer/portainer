angular.module('ui').component('datatableAction', {
  require: {
    datatable: '^^datatable'
  },
  template: '<button type="button" class="btn btn-sm" ng-disabled="$ctrl.requireSelection && $ctrl.datatable.state.selectedItemCount === 0" ng-class="$ctrl.btnStyle" ng-click="$ctrl.action({items: $ctrl.datatable.state.selectedItems})"><i class="fa space-right" ng-class="$ctrl.btnIcon" aria-hidden="true"></i>{{ $ctrl.btnTitle }}</button>',
  bindings: {
    requireSelection: '<',
    btnStyle: '@',
    btnIcon: '@',
    btnTitle: '@',
    action: '&'
  }
});
