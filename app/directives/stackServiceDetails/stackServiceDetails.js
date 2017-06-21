angular.module('portainer')
.controller('porStackServiceDetails', ['$q',
function ($q) {
  var ctrl = this;

  ctrl.state = {
    pagination_count: Pagination.getPaginationCount('stack_serviceDetails')
  };
  ctrl.sortType = 'RoleName';
  ctrl.sortReverse = false;

  $ctrl.order = function(sortType) {
    $ctrl.sortReverse = ($ctrl.sortType === sortType) ? !$ctrl.sortReverse : false;
    $ctrl.sortType = sortType;
  };

  $ctrl.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $ctrl.state.pagination_count);
  };

  function initComponent() {
  }

  initComponent();
}]);
