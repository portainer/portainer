angular.module('portainer.app')
.controller('CreateTemplateController', ['$scope', '$state', 'TemplateService', 'Notifications',
function ($scope, $state, TemplateService, Notifications) {

  $scope.formValues = {
  };

  $scope.state = {
    actionInProgress: false
  };

  function initView() {
  }

  initView();
}]);
