angular.module('portainer')
.controller('porStackV3ServiceDetails', ['Pagination', function (Pagination) {
  var ctrl = this;

  ctrl.state = {
    pagination_count: Pagination.getPaginationCount('stack_serviceDetails')
  };
  ctrl.sortType = 'Name';
  ctrl.sortReverse = false;

  ctrl.order = function(sortType) {
    ctrl.sortReverse = (ctrl.sortType === sortType) ? !ctrl.sortReverse : false;
    ctrl.sortType = sortType;
  };

  ctrl.changePaginationCount = function() {
    Pagination.setPaginationCount('stack_serviceDetails', ctrl.state.pagination_count);
  };
}]);
