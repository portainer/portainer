angular.module('containers', [])
  .controller('ContainersController', ['$q', '$scope', '$filter', 'Container', 'ContainerHelper', 'Info', 'Settings', 'Notifications', 'Config', 'Pagination', 'EntityListService', 'ModalService', 'ResourceControlService', 'EndpointProvider',
  function ($q, $scope, $filter, Container, ContainerHelper, Info, Settings, Notifications, Config, Pagination, EntityListService, ModalService, ResourceControlService, EndpointProvider) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('containers');
  $scope.state.displayAll = Settings.displayAll;
  $scope.state.displayIP = false;
  $scope.sortType = 'State';
  $scope.sortReverse = false;
  $scope.state.selectedItemCount = 0;
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
    $('#loadContainersSpinner').show();
    $scope.state.selectedItemCount = 0;
    Container.query(data, function (d) {
      var containers = d;
      if ($scope.containersToHideLabels) {
        containers = ContainerHelper.hideContainers(d, $scope.containersToHideLabels);
      }
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
      $('#loadContainersSpinner').hide();
    }, function (e) {
      $('#loadContainersSpinner').hide();
      Notifications.error('Failure', e, 'Unable to retrieve containers');
      $scope.containers = [];
    });
  };

  var batch = function (items, action, msg) {
    $('#loadContainersSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadContainersSpinner').hide();
        update({all: Settings.displayAll ? 1 : 0});
      }
    };
    angular.forEach(items, function (c) {
      if (c.Checked) {
        counter = counter + 1;
        if (action === Container.start) {
          action({id: c.Id}, {}, function (d) {
            Notifications.success('Container ' + msg, c.Id);
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'Unable to start container');
            complete();
          });
        }
        else if (action === Container.remove) {
          action({id: c.Id, v: ($scope.cleanAssociatedVolumes) ? 1 : 0, force: true}, function (d) {
            if (d.message) {
              Notifications.error('Error', d, 'Unable to remove container');
            }
            else {
              if (c.ResourceControl && c.ResourceControl.Id) {
                ResourceControlService.deleteResourceControl(c.ResourceControl.Id)
                .then(function success() {
                  Notifications.success('Container ' + msg, c.Id);
                })
                .catch(function error(err) {
                  Notifications.error('Failure', err, 'Unable to remove access control');
                });
              } else {
                Notifications.success('Container ' + msg, c.Id);
              }
            }
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'Unable to remove container');
            complete();
          });
        }
        else if (action === Container.pause) {
          action({id: c.Id}, function (d) {
            if (d.message) {
              Notifications.success('Container is already paused', c.Id);
            } else {
              Notifications.success('Container ' + msg, c.Id);
            }
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'Unable to pause container');
            complete();
          });
        }
        else {
          action({id: c.Id}, function (d) {
            Notifications.success('Container ' + msg, c.Id);
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'An error occured');
            complete();
          });

        }
      }
    });
    if (counter === 0) {
      $('#loadContainersSpinner').hide();
    }
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredContainers, function (container) {
      if (container.Checked !== allSelected) {
        container.Checked = allSelected;
        $scope.selectItem(container);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.toggleGetAll = function () {
    Settings.displayAll = $scope.state.displayAll;
    update({all: Settings.displayAll ? 1 : 0});
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

  Config.$promise.then(function (c) {
    $scope.containersToHideLabels = c.hiddenLabels;
    if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM') {
      Info.get({}, function (d) {
        $scope.swarm_hosts = retrieveSwarmHostsInfo(d);
        update({all: Settings.displayAll ? 1 : 0});
      });
    } else {
      update({all: Settings.displayAll ? 1 : 0});
    }
  });
}]);
