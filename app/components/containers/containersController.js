angular.module('containers', [])
.controller('ContainersController', ['$scope', 'Container', 'Settings', 'Messages', 'ViewSpinner',
function ($scope, Container, Settings, Messages, ViewSpinner) {

  $scope.state = {};
  $scope.state.displayAll = Settings.displayAll;
  $scope.sortType = 'Created';
  $scope.sortReverse = true;
  $scope.state.toggle = false;
  $scope.state.selectedItemCount = 0;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  var update = function (data) {
    ViewSpinner.spin();
    $scope.state.selectedItemCount = 0;
    Container.query(data, function (d) {
      $scope.containers = d.filter(function (container) {
        return container.Image !== 'swarm';
      }).map(function (container) {
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
        if (action === Container.start) {
          Container.get({id: c.Id}, function (d) {
            c = d;
            counter = counter + 1;
            action({id: c.Id, HostConfig: c.HostConfig || {}}, function (d) {
              Messages.send("Container " + msg, c.Id);
              var index = $scope.containers.indexOf(c);
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
        else {
          counter = counter + 1;
          action({id: c.Id}, function (d) {
            Messages.send("Container " + msg, c.Id);
            var index = $scope.containers.indexOf(c);
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

  $scope.toggleSelectAll = function () {
    $scope.state.selectedItem = $scope.state.toggle;
    angular.forEach($scope.state.filteredContainers, function (i) {
      i.Checked = $scope.state.toggle;
    });
    if ($scope.state.toggle) {
      $scope.state.selectedItemCount = $scope.state.filteredContainers.length;
    } else {
      $scope.state.selectedItemCount = 0;
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

  update({all: Settings.displayAll ? 1 : 0});
}]);
