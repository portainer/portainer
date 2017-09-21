angular.module('endpointAccess', [])
.controller('EndpointAccessController', ['$scope', '$uiRouterGlobals', 'EndpointService', 'Notifications',
function ($scope, $uiRouterGlobals, EndpointService, Notifications) {

  $scope.updateAccess = function(authorizedUsers, authorizedTeams) {
    return EndpointService.updateAccess($uiRouterGlobals.params.id, authorizedUsers, authorizedTeams);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    EndpointService.endpoint($uiRouterGlobals.params.id)
    .then(function success(data) {
      $scope.endpoint = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint details');
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
