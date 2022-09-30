angular.module('portainer.app').controller('EditSceneController', [
  '$q',
  '$scope',
  '$state',
  '$transition$',
  'SceneService',
  'Notifications',
  function EditSceneController($q, $scope, $state, $transition$, SceneService, Notifications) {
    $scope.state = {
      actionInProgress: false,
    };

    $scope.edit = () => {
      let model = $scope.model;

      $scope.state.actionInProgress = true;
      SceneService.updateScene(model).then(function success() {
        Notifications.success('Scene successfully updated');
        $state.go('portainer.scenes', {}, { reload: true });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to update scenes');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
    }

    function initView() {
      $q.all({
        scene: SceneService.scene($transition$.params().id),
      }).then(function success(data) {
          $scope.model = data.scene;
          $scope.loaded = true;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load scenes details');
        });
    }

    initView();
  }
]);
