angular.module('registries', [])
.controller('RegistriesController', ['$q', '$scope', '$state', 'RegistryService', 'DockerHubService', 'ModalService', 'Notifications', 'PaginationService',
function ($q, $scope, $state, RegistryService, DockerHubService, ModalService, Notifications, PaginationService) {

  $scope.state = {
    // selectedItemCount: 0,
    // pagination_count: Pagination.getPaginationCount('registries'),
    actionInProgress: false
  };
  // $scope.sortType = 'Name';
  // $scope.sortReverse = true;

  // $scope.order = function(sortType) {
  //   $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
  //   $scope.sortType = sortType;
  // };
  //
  // $scope.changePaginationCount = function() {
  //   PaginationService.setPaginationCount('endpoints', $scope.state.pagination_count);
  // };
  //
  // $scope.selectItems = function (allSelected) {
  //   angular.forEach($scope.state.filteredRegistries, function (registry) {
  //     if (registry.Checked !== allSelected) {
  //       registry.Checked = allSelected;
  //       $scope.selectItem(registry);
  //     }
  //   });
  // };
  //
  // $scope.selectItem = function (item) {
  //   if (item.Checked) {
  //     $scope.state.selectedItemCount++;
  //   } else {
  //     $scope.state.selectedItemCount--;
  //   }
  // };

  $scope.renderLabel = function(item) {
    if (item.Authentication) {
      return '<span style="margin-left: 10px;" class="label label-info image-tag">authentication-enabled</span>';
    }
    return '';
  };

  $scope.goToRegistryCreation = function() {
    $state.go('actions.create.registry');
  };

  $scope.updateDockerHub = function() {
    var dockerhub = $scope.dockerhub;
    $scope.state.actionInProgress = true;
    DockerHubService.update(dockerhub)
    .then(function success(data) {
      Notifications.success('DockerHub registry updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update DockerHub details');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.removeAction = function() {
    ModalService.confirmDeletion(
      'Do you want to remove the selected registries?',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeRegistries();
      }
    );
  };

  function removeRegistries() {
    var registries = $scope.registries;
    angular.forEach(registries, function (registry) {
      if (registry.Checked) {
        RegistryService.deleteRegistry(registry.Id)
        .then(function success(data) {
          var index = registries.indexOf(registry);
          registries.splice(index, 1);
          Notifications.success('Registry deleted', registry.Name);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove registry');
        });
      }
    });
  }

  function initView() {
    $q.all({
      registries: RegistryService.registries(),
      dockerhub: DockerHubService.dockerhub()
    })
    .then(function success(data) {
      $scope.registries = data.registries;
      $scope.dockerhub = data.dockerhub;
    })
    .catch(function error(err) {
      $scope.registries = [];
      Notifications.error('Failure', err, 'Unable to retrieve registries');
    });
  }

  initView();
}]);
