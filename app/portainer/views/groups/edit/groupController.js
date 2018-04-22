angular.module('portainer.app')
.controller('GroupController', ['$scope', '$state', '$transition$', '$filter', 'EndpointService', 'Notifications',
function ($scope, $state, $transition$, $filter, EndpointService, Notifications) {

  function initView() {
    // EndpointService.endpoint($transition$.params().id)
    // .then(function success(data) {
    //   var endpoint = data;
    //   if (endpoint.URL.indexOf('unix://') === 0) {
    //     $scope.endpointType = 'local';
    //   } else {
    //     $scope.endpointType = 'remote';
    //   }
    //   endpoint.URL = $filter('stripprotocol')(endpoint.URL);
    //   $scope.endpoint = endpoint;
    // })
    // .catch(function error(err) {
    //   Notifications.error('Failure', err, 'Unable to retrieve endpoint details');
    // });
  }

  initView();
}]);
