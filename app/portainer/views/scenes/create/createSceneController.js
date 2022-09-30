import { SceneDefaultModel } from '../../../models/scene';

angular.module('portainer.app').controller('CreateSceneController', CreateSceneController);
// import _ from 'lodash';

function CreateSceneController($scope, $state, SceneService, Notifications) {
  $scope.state = {
    actionInProgress: false,
  };

  $scope.create = function () {
    let model = $scope.model;

    $scope.state.actionInProgress = true;
    SceneService.createScene(model)
      .then(function success() {
        Notifications.success('Scene successfully created');
        $state.go('portainer.scenes', {}, { reload: true });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to create scenes');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
  };

  function initView() {
    $scope.model = new SceneDefaultModel();
    $scope.loaded = true;
  }

  initView();
}
