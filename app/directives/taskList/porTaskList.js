angular.module('portainer')
.controller('porTaskListController', ['PaginationService',
function (PaginationService) {
  var ctrl = this;
  ctrl.state = {
    pagination_count: PaginationService.getPaginationCount('tasks_list')
  };
  ctrl.sortType = 'Updated';
  ctrl.sortReverse = true;

  ctrl.order = function(sortType) {
    ctrl.sortReverse = (ctrl.sortType === sortType) ? !ctrl.sortReverse : false;
    ctrl.sortType = sortType;
  };

  ctrl.changePaginationCount = function() {
    PaginationService.setPaginationCount('tasks_list', ctrl.state.pagination_count);
  };
}]);
