angular.module('containers', [])
.controller('ContainersController', ['$scope', 'Container', 'Info', 'Settings', 'Messages', 'Config', 'errorMsgFilter',
function ($scope, Container, Info, Settings, Messages, Config, errorMsgFilter) {

  $scope.state = {};
  $scope.state.displayAll = Settings.displayAll;
  $scope.state.displayIP = false;
  $scope.sortType = 'State';
  $scope.sortReverse = false;
  $scope.state.selectedItemCount = 0;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  var update = function (data) {
    $('#loadContainersSpinner').show();
    $scope.state.selectedItemCount = 0;
    Container.query(data, function (d) {
      var containers = d;
      if (hiddenLabels) {
        containers = hideContainers(d);
      }
      $scope.containers = containers.map(function (container) {
        var model = new ContainerViewModel(container);
        if (model.IP) {
          $scope.state.displayIP = true;
        }
        if ($scope.swarm) {
          model.hostIP = $scope.swarm_hosts[_.split(container.Names[0], '/')[1]];
        }
        return model;
      });
      $('#loadContainersSpinner').hide();
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
          Container.get({id: c.Id}, function (d) {
            c = d;
            action({id: c.Id, HostConfig: c.HostConfig || {}}, function (d) {
              Messages.send("Container " + msg, c.Id);
              complete();
            }, function (e) {
              Messages.error("Failure", e.data);
              complete();
            });
          }, function (e) {
            if (e.status === 404) {
              $('.detail').hide();
              Messages.error("Not found", "Container not found.");
            } else {
              Messages.error("Failure", e.data);
            }
            complete();
          });
        }
        else if (action === Container.remove) {
          action({id: c.Id}, function (d) {
            var error = errorMsgFilter(d);
            if (error) {
              Messages.send("Error", "Unable to remove running container");
            }
            else {
              Messages.send("Container " + msg, c.Id);
            }
            complete();
          }, function (e) {
            Messages.error("Failure", e.data);
            complete();
          });
        }
        else {
          action({id: c.Id}, function (d) {
            Messages.send("Container " + msg, c.Id);
            complete();
          }, function (e) {
            Messages.error("Failure", e.data);
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

  var hideContainers = function (containers) {
    return containers.filter(function (container) {
      var filterContainer = false;
      hiddenLabels.forEach(function(label, index) {
        if (_.has(container.Labels, label.name) &&
        container.Labels[label.name] === label.value) {
          filterContainer = true;
        }
      });
      if (!filterContainer) {
        return container;
      }
    });
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
    hiddenLabels = c.hiddenLabels;
    $scope.swarm = c.swarm;
    if (c.swarm) {
      Info.get({}, function (d) {
        $scope.swarm_hosts = retrieveSwarmHostsInfo(d);
        update({all: Settings.displayAll ? 1 : 0});
      });
    } else {
      update({all: Settings.displayAll ? 1 : 0});
    }
  });
}]);
