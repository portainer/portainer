angular.module('containers', [])
.controller('ContainersController', ['$scope', 'Container', 'Settings', 'Messages', 'ViewSpinner', 'Config', 'errorMsgFilter',
function ($scope, Container, Settings, Messages, ViewSpinner, Config, errorMsgFilter) {

  $scope.state = {};
  $scope.state.displayAll = Settings.displayAll;
  $scope.sortType = 'State';
  $scope.sortReverse = true;
  $scope.state.selectedItemCount = 0;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  var update = function (data) {
    ViewSpinner.spin();
    $scope.state.selectedItemCount = 0;
    Container.query(data, function (d) {
      var containers = d;
      if (hiddenLabels) {
        containers = hideContainers(d);
      }
      $scope.containers = containers.map(function (container) {
        return new ContainerViewModel(container);
      });
      ViewSpinner.stop();
    });
  };

  var batch = function (items, action, msg) {
    ViewSpinner.spin();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        ViewSpinner.stop();
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
      ViewSpinner.stop();
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

  $scope.swarm = false;
  Config.$promise.then(function (c) {
    hiddenLabels = c.hiddenLabels;
    $scope.swarm = c.swarm;
    update({all: Settings.displayAll ? 1 : 0});
  });
}]);
