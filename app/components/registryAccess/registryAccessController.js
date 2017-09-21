angular.module('registryAccess', [])
.controller('RegistryAccessController', ['$scope', '$uiRouterGlobals', 'RegistryService', 'Notifications',
function ($scope, $uiRouterGlobals, RegistryService, Notifications) {

  $scope.updateAccess = function(authorizedUsers, authorizedTeams) {
    return RegistryService.updateAccess($uiRouterGlobals.params.id, authorizedUsers, authorizedTeams);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    RegistryService.registry($uiRouterGlobals.params.id)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
