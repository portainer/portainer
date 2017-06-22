angular.module('portainer')
.controller('porTaskListController', ['Pagination',
function (Pagination) {
  var ctrl = this;
  ctrl.state = {
    pagination_count: Pagination.getPaginationCount('tasks_list')
  };
  ctrl.sortType = 'Updated';
  ctrl.sortReverse = true;

  ctrl.order = function(sortType) {
    ctrl.sortReverse = (ctrl.sortType === sortType) ? !ctrl.sortReverse : false;
    ctrl.sortType = sortType;
  };

  ctrl.changePaginationCount = function() {
    Pagination.setPaginationCount('tasks_list', ctrl.state.pagination_count);
  };
}]);
