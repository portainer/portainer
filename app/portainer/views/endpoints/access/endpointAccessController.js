angular.module('portainer.app')
.controller('EndpointAccessController', ['$scope', '$transition$', 'EndpointService', 'Notifications',
function ($scope, $transition$, EndpointService, Notifications) {

  $scope.updateAccess = function(authorizedUsers, authorizedTeams) {
    return EndpointService.updateAccess($transition$.params().id, authorizedUsers, authorizedTeams);
  };

  function initView() {
    EndpointService.endpoint($transition$.params().id)
    .then(function success(data) {
      $scope.endpoint = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint details');
    });
  }

  initView();
}]);
