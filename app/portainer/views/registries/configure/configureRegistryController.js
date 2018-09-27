angular.module('portainer.app')
.controller('ConfigureRegistryController', ['$scope', '$state', '$transition$', 'RegistryService', 'Notifications',
function ($scope, $state, $transition$, RegistryService, Notifications) {

  $scope.formValues = {
    Authentication: false,
    Username: '',
    Password: '',
    TLS: false,
    TLSSkipVerify: false,
    TLSCertificate: null,
    TLSKey: null
  };

  function initView() {
    var registryId = $transition$.params().id;

    RegistryService.registry(registryId)
    .then(function success(data) {
      var registry = data;
      $scope.registry = data;
      if (registry.Authentication) {
        $scope.formValues.Authentication = true;
        $scope.formValues.Username = registry.Username;
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
