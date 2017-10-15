angular.module('portainer')
.controller('porServiceListController', ['EndpointProvider', 'Pagination',
function (EndpointProvider, Pagination) {
  var ctrl = this;
  ctrl.state = {
    pagination_count: Pagination.getPaginationCount('services_list'),
    publicURL: EndpointProvider.endpointPublicURL()
  };
  ctrl.sortType = 'Name';
  ctrl.sortReverse = false;

  ctrl.order = function(sortType) {
    ctrl.sortReverse = (ctrl.sortType === sortType) ? !ctrl.sortReverse : false;
    ctrl.sortType = sortType;
  };

  ctrl.changePaginationCount = function() {
    Pagination.setPaginationCount('services_list', ctrl.state.pagination_count);
  };

}]);
