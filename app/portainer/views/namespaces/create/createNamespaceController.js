import { NamespaceDefaultModel } from '../../../models/namespace';

angular.module('portainer.app').controller('CreateNamespaceController', CreateNamespaceController);

function CreateNamespaceController($scope, $state, NamespaceService, Notifications) {
  $scope.state = {
    actionInProgress: false,
  };

  $scope.create = function () {
    let model = $scope.model;

    $scope.state.actionInProgress = true;
    NamespaceService.createNamespace(model)
      .then(function success() {
        Notifications.success('Namespace successfully created');
        $state.go('portainer.namespaces', {}, { reload: true });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to create namespaces');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
  };

  function initView() {
    $scope.model = new NamespaceDefaultModel();
    $scope.loaded = true;
  }

  initView();
}
