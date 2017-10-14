angular.module('portainer')
.controller('porStackV2ServiceDetails', ['$state', 'Pagination', 'StackService', 'Notifications',
function ($state, Pagination, StackService, Notifications) {
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

  ctrl.scaleService = function(serviceName, scale) {
    $('#loadingViewSpinner').show();
    StackService.scaleService(ctrl.stack.Id, serviceName, scale)
    .then(function success(data) {
      Notifications.success('Service successfully scaled');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to scale service');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };
}]);
