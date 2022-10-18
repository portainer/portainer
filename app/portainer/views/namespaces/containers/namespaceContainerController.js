angular.module('portainer.app').controller('NamespaceContainerController', [
  '$q',
  '$scope',
  '$state',
  'Notifications',
  function ($q, $scope, $state, Notifications) {
    $scope.state = {
      actionInProgress: false,
    };

    function initView() {
      Notifications.success('loading', 'Container list')
      return null;
    }
  
    initView();
  }

])