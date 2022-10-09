angular.module('portainer.app').controller('ContainerSceneController', ContainerSceneController);
// import _ from 'lodash';

function ContainerSceneController($q, $scope, $state, $transition$, PaginationService, SceneService, Notifications) {
  $scope.state = {
    actionInProgress: false,
    pagination_count_free_containers: PaginationService.getPaginationLimit('free_containers'),
    pagination_count_use_containers: PaginationService.getPaginationLimit('use_containers'),
  };

  $scope.sortTypeFreeContainers = 'containers';
  $scope.sortReverseFreeContainers = true;
  $scope.containers = [
    {
      "Name": "nginx",
      "Namespace": "代理网络"
    },
    {
      "Name": "bisnavC000",
      "Namespace": "路径导航v1.0"
    },
  ];
  $scope.useContainers = [
    {
      "Name": "bisnavC001",
      "Namespace": "bisna-v1.0"
    }
  ];

  $scope.orderContainers = (sortType) => {
    $scope.sortReverseFreeContainers = $scope.sortTypeFreeContainers === sortType ? !$scope.sortTypeFreeContainers : false;
    $scope.sortTypeFreeContainers = sortType;
  }


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
    $q.all({
      scene: SceneService.scene($transition$.params().id),
    })
      .then(function success(data) {
        $scope.model = data.scene;
        $scope.loaded = true;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to load scenes details');
      });
  }

  initView();
}
