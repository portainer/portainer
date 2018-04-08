angular.module('portainer.app')
.controller('CreateRegistryController', ['$scope', '$state', 'RegistryService', 'Notifications',
function ($scope, $state, RegistryService, Notifications) {

  $scope.state = {
    RegistryType: 'quay',
    actionInProgress: false
  };

  $scope.formValues = {
    Name: 'Quay',
    URL: 'quay.io',
    TLSVerification: true,
    Authentication: true,
    Username: '',
    Password: ''
  };

  $scope.selectQuayRegistry = function() {
    $scope.formValues.Name = 'Quay';
    $scope.formValues.URL = 'quay.io';
    $scope.formValues.TLSVerification = true;    
    $scope.formValues.Authentication = true;
  };

  $scope.selectCustomRegistry = function() {
    $scope.formValues.Name = '';
    $scope.formValues.URL = '';
    $scope.formValues.TLSVerification = true;
    $scope.formValues.Authentication = false;
  };

  $scope.addRegistry = function() {
    var registryName = $scope.formValues.Name;
    var registryURL = $scope.formValues.URL.replace(/^https?\:\/\//i, '');
    var tlsVerification = $scope.formValues.TLSVerification;
    var authentication = $scope.formValues.Authentication;
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;

    $scope.state.actionInProgress = true;
    RegistryService.createRegistry(registryName, registryURL, authentication, username, password, tlsVerification)
    .then(function success(data) {
      Notifications.success('Registry successfully created');
      $state.go('portainer.registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create registry');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };
}]);
