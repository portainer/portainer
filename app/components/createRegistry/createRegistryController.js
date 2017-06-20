angular.module('createRegistry', [])
.controller('CreateRegistryController', ['$scope', '$state', 'RegistryService', 'Notifications',
function ($scope, $state, RegistryService, Notifications) {

  $scope.state = {
    RegistryType: 'quay'
  };

  $scope.formValues = {
    Name: 'Quay',
    URL: 'quay.io',
    Authentication: true,
    Username: '',
    Password: ''
  };

  $scope.selectQuayRegistry = function() {
    $scope.formValues.Name = 'Quay';
    $scope.formValues.URL = 'quay.io';
    $scope.formValues.Authentication = true;
  };

  $scope.selectCustomRegistry = function() {
    $scope.formValues.Name = '';
    $scope.formValues.URL = '';
    $scope.formValues.Authentication = false;
  };

  $scope.addRegistry = function() {
    $('#createRegistrySpinner').show();
    var registryName = $scope.formValues.Name;
    var registryURL = $scope.formValues.URL.replace(/^https?\:\/\//i, '');
    var authentication = $scope.formValues.Authentication;
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;

    RegistryService.createRegistry(registryName, registryURL, authentication, username, password)
    .then(function success(data) {
      Notifications.success('Registry successfully created');
      $state.go('registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create registry');
    })
    .finally(function final() {
      $('#createRegistrySpinner').hide();
    });
  };
}]);
