angular.module('portainer.app').controller('ScenesController', ScenesController);
import _ from 'lodash';

function ScenesController($scope, $state, $async, SceneService, Notifications) {
  $scope.state = {
    actionInProgress: false,
    scenes: []
  };

  $scope.handleClick = (item) => {
    alert(item)
  }

  $scope.removeAction = removeAction;

  function removeAction(item) {
    return $async(removeActionAsync, item);
  }

  async function removeActionAsync(item) {
    try {
      await SceneService.deleteScene(item.Id).then(() => {
        Notifications.success('Scenes successfully removed', item.Name);
        _.remove($scope.scenes, item);
      })
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to remove scenes');
    }

    $state.reload();
  }

  function initView() {
    SceneService.scenes().then((data) => {
      $scope.state.scenes = data;
      console.log('scenes: ', $scope.state.scenes)
    })
    .catch((err) => {
      Notifications.error('Failure', err, 'Unable to retrieve scenes');
      $scope.state.scenes = [];
    });
  }

  initView();
}

