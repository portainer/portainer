angular.module('containers', [])
  .controller('ContainersController', ['$q', '$scope', '$filter', 'Container', 'ContainerService', 'ContainerHelper', 'SystemService', 'Notifications', 'Pagination', 'EntityListService', 'ModalService', 'ResourceControlService', 'EndpointProvider', 'LocalStorage',
  function ($q, $scope, $filter, Container, ContainerService, ContainerHelper, SystemService, Notifications, Pagination, EntityListService, ModalService, ResourceControlService, EndpointProvider, LocalStorage) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('containers');
  $scope.state.displayAll = LocalStorage.getFilterContainerShowAll();
  $scope.state.displayIP = false;
  $scope.sortType = 'State';
  $scope.sortReverse = false;
  $scope.state.selectedItemCount = 0;
  $scope.truncate_size = 40;
  $scope.showMore = true;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };
  $scope.PublicURL = EndpointProvider.endpointPublicURL();

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('containers', $scope.state.pagination_count);
  };

  $scope.cleanAssociatedVolumes = false;

  var update = function (data) {
    $scope.state.selectedItemCount = 0;
    Container.query(data, function (d) {
      var containers = d;
      $scope.containers = containers.map(function (container) {
        var model = new ContainerViewModel(container);
        model.Status = $filter('containerstatus')(model.Status);

        EntityListService.rememberPreviousSelection($scope.containers, model, function onSelect(model){
          $scope.selectItem(model);
        });

        if (model.IP) {
          $scope.state.displayIP = true;
        }
        if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM') {
          model.hostIP = $scope.swarm_hosts[_.split(container.Names[0], '/')[1]];
        }
        return model;
      });
      updateSelectionFlags();
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve containers');
      $scope.containers = [];
    });
  };

  var batch = function (items, action, msg) {
    angular.forEach(items, function (c) {
      if (c.Checked) {
        if (action === Container.start) {
          action({id: c.Id}, {}, function (d) {
            Notifications.success('Container ' + msg, c.Id);
          }, function (e) {
            Notifications.error('Failure', e, 'Unable to start container');
          });
        }
        else if (action === Container.remove) {
          ContainerService.remove(c, $scope.cleanAssociatedVolumes)
          .then(function success() {
            Notifications.success('Container successfully removed');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove container');
          });
        }
        else if (action === Container.pause) {
          action({id: c.Id}, function (d) {
            if (d.message) {
              Notifications.success('Container is already paused', c.Id);
            } else {
              Notifications.success('Container ' + msg, c.Id);
            }
          }, function (e) {
            Notifications.error('Failure', e, 'Unable to pause container');
          });
        }
        else {
          action({id: c.Id}, function (d) {
            Notifications.success('Container ' + msg, c.Id);
          }, function (e) {
            Notifications.error('Failure', e, 'An error occured');
          });
        }
      }
    });
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredContainers, function (container) {
      if (container.Checked !== allSelected) {
        container.Checked = allSelected;
        toggleItemSelection(container);
      }
    });
    updateSelectionFlags();
  };

  $scope.selectItem = function (item) {
    toggleItemSelection(item);
    updateSelectionFlags();
  };

  $scope.toggleGetAll = function () {
    LocalStorage.storeFilterContainerShowAll($scope.state.displayAll);
    update({all: $scope.state.displayAll ? 1 : 0});
  };

  $scope.startAction = function () {
    batch($scope.containers, Container.start, 'Started');
  };

  $scope.stopAction = function () {
    batch($scope.containers, Container.stop, 'Stopped');
  };

  $scope.restartAction = function () {
    batch($scope.containers, Container.restart, 'Restarted');
  };

  $scope.killAction = function () {
    batch($scope.containers, Container.kill, 'Killed');
  };

  $scope.pauseAction = function () {
    batch($scope.containers, Container.pause, 'Paused');
  };

  $scope.unpauseAction = function () {
    batch($scope.containers, Container.unpause, 'Unpaused');
  };

  $scope.removeAction = function () {
    batch($scope.containers, Container.remove, 'Removed');
  };


  $scope.truncateMore = function(size) {
    $scope.truncate_size = 80;
    $scope.showMore = false;
  };

  $scope.confirmRemoveAction = function () {
    var isOneContainerRunning = false;
    angular.forEach($scope.containers, function (c) {
      if (c.Checked && c.State === 'running') {
        isOneContainerRunning = true;
        return;
      }
    });
    var title = 'You are about to remove one or more container.';
    if (isOneContainerRunning) {
      title = 'You are about to remove one or more running containers.';
    }
    ModalService.confirmContainerDeletion(
      title,
      function (result) {
        if(!result) { return; }
        $scope.cleanAssociatedVolumes = false;
        if (result[0]) {
          $scope.cleanAssociatedVolumes = true;
        }
        $scope.removeAction();
      }
    );
  };

  function toggleItemSelection(item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  }

  function updateSelectionFlags() {
    $scope.state.noStoppedItemsSelected = true;
    $scope.state.noRunningItemsSelected = true;
    $scope.state.noPausedItemsSelected = true;
    $scope.containers.forEach(function(container) {
      if(!container.Checked) {
        return;
      }

      if(container.Status === 'paused') {
        $scope.state.noPausedItemsSelected = false;
      } else if(container.Status === 'stopped' ||
                container.Status === 'created') {
        $scope.state.noStoppedItemsSelected = false;
      } else if(container.Status === 'running') {
        $scope.state.noRunningItemsSelected = false;
      }
    } );
  }

  function retrieveSwarmHostsInfo(data) {
    var swarm_hosts = {};
    var systemStatus = data.SystemStatus;
    var node_count = parseInt(systemStatus[3][1], 10);
    var node_offset = 4;
    for (i = 0; i < node_count; i++) {
      var host = {};
      host.name = _.trim(systemStatus[node_offset][0]);
      host.ip = _.split(systemStatus[node_offset][1], ':')[0];
      swarm_hosts[host.name] = host.ip;
      node_offset += 9;
    }
    return swarm_hosts;
  }

  function initView() {
    var provider = $scope.applicationState.endpoint.mode.provider;
    $q.when(provider !== 'DOCKER_SWARM' || SystemService.info())
    .then(function success(data) {
      if (provider === 'DOCKER_SWARM') {
        $scope.swarm_hosts = retrieveSwarmHostsInfo(data);
      }
      update({all: $scope.state.displayAll ? 1 : 0});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve cluster information');
    });
  }

  initView();
}]);
