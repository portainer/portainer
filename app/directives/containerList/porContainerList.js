angular.module('portainer')
.controller('porContainerListController', ['Pagination',
function (Pagination) {
  var ctrl = this;

  ctrl.state = {
    pagination_count: Pagination.getPaginationCount('containers_list')
  };
  ctrl.sortType = 'Name';
  ctrl.sortReverse = false;

  ctrl.order = function(sortType) {
    ctrl.sortReverse = (ctrl.sortType === sortType) ? !ctrl.sortReverse : false;
    ctrl.sortType = sortType;
  };

  ctrl.changePaginationCount = function() {
    Pagination.setPaginationCount('containers_list', ctrl.state.pagination_count);
  };

}]);
