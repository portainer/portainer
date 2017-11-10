angular.module('project', [])
.controller('ProjectController', ['$cacheFactory', '$q', '$http', '$window', '$interval', '$scope', '$state', '$transition$', 'SwarmService', 'StackService', 'StackCreateService', 'LabelHelper', 'ProjectService', 'Pagination', 'Notifications',
function ($cacheFactory, $q, $http, $window, $interval, $scope, $state, $transition$, SwarmService, StackService, StackCreateService, LabelHelper, ProjectService, Pagination, Notifications) {

  $scope.state = {};
  $scope.loading = true;
  $scope.tasks = [];
  $scope.sortType = 'Status';
  $scope.sortReverse = false;
  $scope.state.pagination_count = Pagination.getPaginationCount('messageStatus');

  var statusPromise;

  $scope.getStackContent = function(content) {
    var deferred = $q.defer();
    var $httpDefaultCache = $cacheFactory.get('$http');
    var key = content + "?" + Date.now();
    $httpDefaultCache.remove(key);

    $http({
        method: 'GET',
        url: key,
        cache: $httpDefaultCache
    }).success(function (response) {
        deferred.resolve(response);
    }).error(function (msg) {
        deferred.reject(msg);
    });

    return deferred.promise;
  }

  $scope.createStack = function(id, content) {
      if (!content || content == "undefined") {
        // Take a while guess...
        content = '/projectroot/envs/' + id + '/target/docker-compose.yml'
      }

      StackCreateService.setName(id);
      $scope.getStackContent(content)
      .then(function(data) {
            // TODO: validate data returned...
            StackCreateService.setStackFileContent(data);
            $window.location.href = '/#/actions/create/stack';
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Missing project definition YAML (render first)');
      });
  };

  $scope.updateStack = function(id, content) {
      $scope.getStackContent(content)
      .then(function(data) {
        StackCreateService.setStackFileContent(data);
        $window.location.href = '/#/stacks/' + id + '/' + 'true/';
      });
  };

  $scope.render = function () {
    $('#loadingViewSpinner').show();

    ProjectService.render($transition$.params().id)
        .then(function success(data) {
          Notifications.success('Project rendering successfully launched...');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to launch project render');
        })
        .finally(function final() {
          $('#loadingViewSpinner').hide();
        });
  };

  $scope.statusAction = function () {
    $('#loadingViewSpinner').show();

    ProjectService.operationStatus($transition$.params().id)
        .then(function success(data) {
          if (data.Name == $transition$.params().id + ": ") {
            $scope.operationStatus = {Name: "No active operations"};
            $('#operationsLoadingViewSpinner').hide();
          } else {
            $('#operationsLoadingViewSpinner').show();
            $scope.operationStatus = data;
          }
          ProjectService.messageStatus($transition$.params().id)
            .then(function success(data) {
              var messages = [];
              var errors = [];
              for (var i = 0; i < data.length; i++) {
                  var entry = data[i];
                  if (entry.Name != '' && entry.Messages != [] && entry.Messages != '') {
                    messages.push({Name: entry.Name, Messages: entry.Messages});
                  }
                  if (entry.Name != '' && entry.Errors != [] && entry.Errors != '') {
                    errors.push({Name: entry.Name, Errors: entry.Errors});
                  }
              }
              if (messages != [] && messages != '' && messages != null) {
                $scope.messages = messages;
              } else {
                delete $scope.messages;
              }
              if (errors != [] && errors != '' && errors != null) {
                $scope.errors = errors;
              } else {
                delete $scope.errors;
              }
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to get Orca message status');
            });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to get Orca operation status');
        })
        .finally(function final() {
          $('#loadingViewSpinner').hide();
        });
  };

  function initView() {
    $scope.loading = true;

    ProjectService.externalProject($transition$.params().id)
    .then(function success(data) {
        $scope.project = data;
        if ($transition$.params().content != '') {
            $scope.project.Content = $transition$.params().content;
        }

        // console.log("Refreshing view with ID: " + $transition$.params().id)

        dataId = data.Id;
        if (!dataId || dataId == "") {
            dataId = $transition$.params().id;
        }
        dataParentDirName = data.ParentDirName;
        if (!dataParentDirName || dataParentDirName == "") {
            // Default...
            // TODO: hack
            dataParentDirName = 'envs';
        }

        // Load image from Orca UI directly
        ProjectService.getProjectImage(dataId, dataParentDirName)
        .then(function success(imgdata) {
            $scope.projectImg = imgdata;
        })
        .catch(function error(err) {
            console.error("Unable to find project image to load");
        });

        SwarmService.swarm()
        .then(function success(data) {
            var swarm = data;
            StackService.stack($transition$.params().id+"_"+swarm.Id)
            .then(function success(stackdata) {
                $scope.stack = stackdata;
            })
            .catch(function error(err) {
                console.log("No stack found with this ID");
            });
        })
        .catch(function error(err) {
            console.log("No swarm data found");
        });

        $scope.statusAction()
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve project');
    })
    .finally(function final() {
      if ($scope.project.Name == "") {
        $scope.project = new ProjectViewModel({ Name: $transition$.params().id, Release: $transition$.params().version, Content: $transition$.params().content, External: true });
      }
      $scope.loading = false;
      $('#operationsLoadingViewSpinner').hide();
      statusPromise = $interval($scope.statusAction, 5000);
    });
  }

  $scope.$on('$destroy', function() {
      $interval.cancel(statusPromise);
  });

  initView();
}]);