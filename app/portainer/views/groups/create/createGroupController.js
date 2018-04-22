angular.module('portainer.app')
.controller('CreateGroupController', ['$scope', '$state', 'GroupService', 'Notifications',
function ($scope, $state, GroupService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    Name: '',
    Description: ''
  };

  $scope.addGroup = function() {
    // var registryName = $scope.formValues.Name;
    // var registryURL = $scope.formValues.URL.replace(/^https?\:\/\//i, '');
    // var authentication = $scope.formValues.Authentication;
    // var username = $scope.formValues.Username;
    // var password = $scope.formValues.Password;
    //
    // $scope.state.actionInProgress = true;
    // RegistryService.createRegistry(registryName, registryURL, authentication, username, password)
    // .then(function success(data) {
    //   Notifications.success('Registry successfully created');
    //   $state.go('portainer.registries');
    // })
    // .catch(function error(err) {
    //   Notifications.error('Failure', err, 'Unable to create registry');
    // })
    // .finally(function final() {
    //   $scope.state.actionInProgress = false;
    // });
  };
}]);
