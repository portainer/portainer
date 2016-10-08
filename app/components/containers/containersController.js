angular.module('containers', [])
.controller('ContainersController', ['$scope', 'Container', 'ContainerHelper', 'Info', 'Settings', 'Messages', 'Config',
function ($scope, Container, ContainerHelper, Info, Settings, Messages, Config) {
  $scope.state = {};
  $scope.state.displayAll = Settings.displayAll;
  $scope.state.displayIP = false;
  $scope.sortType = 'State';
  $scope.sortReverse = false;
  $scope.state.selectedItemCount = 0;
  $scope.swarm_mode = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

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
        if (model.IP) {
          $scope.state.displayIP = true;
        }
        if ($scope.swarm && !$scope.swarm_mode) {
          model.hostIP = $scope.swarm_hosts[_.split(container.Names[0], '/')[1]];
        }
        return model;
      });
      $('#loadContainersSpinner').hide();
    }, function (e) {
      $('#loadContainersSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve containers");
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
            Messages.send("Container " + msg, c.Id);
            complete();
          }, function (e) {
            Messages.error("Failure", e, "Unable to start container");
            complete();
          });
        }
        else if (action === Container.remove) {
          action({id: c.Id}, function (d) {
            if (d.message) {
              Messages.send("Error", d.message);
            }
            else {
              Messages.send("Container " + msg, c.Id);
            }
            complete();
          }, function (e) {
            Messages.error("Failure", e, 'Unable to remove container');
            complete();
          });
        }
        else {
          action({id: c.Id}, function (d) {
            Messages.send("Container " + msg, c.Id);
            complete();
          }, function (e) {
            Messages.error("Failure", e, 'An error occured');
            complete();
          });

        }
      }
    });
    if (counter === 0) {
      $('#loadContainersSpinner').hide();
    }
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
    batch($scope.containers, Container.start, "Started");
  };

  $scope.stopAction = function () {
    batch($scope.containers, Container.stop, "Stopped");
  };

  $scope.restartAction = function () {
    batch($scope.containers, Container.restart, "Restarted");
  };

  $scope.killAction = function () {
    batch($scope.containers, Container.kill, "Killed");
  };

  $scope.pauseAction = function () {
    batch($scope.containers, Container.pause, "Paused");
  };

  $scope.unpauseAction = function () {
    batch($scope.containers, Container.unpause, "Unpaused");
  };

  $scope.removeAction = function () {
    batch($scope.containers, Container.remove, "Removed");
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

  $scope.swarm = false;
  Config.$promise.then(function (c) {
    $scope.containersToHideLabels = c.hiddenLabels;
    $scope.swarm = c.swarm;
    if (c.swarm) {
      Info.get({}, function (d) {
        if (!_.startsWith(d.ServerVersion, 'swarm')) {
          $scope.swarm_mode = true;
        } else {
          $scope.swarm_hosts = retrieveSwarmHostsInfo(d);
        }
        update({all: Settings.displayAll ? 1 : 0});
      });
    } else {
      update({all: Settings.displayAll ? 1 : 0});
    }
  });
}]);
