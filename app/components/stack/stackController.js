angular.module('stack', [])
.controller('StackController', ['$q', '$scope', '$stateParams', 'StackService', 'ServiceService', 'NodeService', 'Notifications',
function ($q, $scope, $stateParams, StackService, ServiceService, NodeService, Notifications) {

  function initView() {
    $('#loadingViewSpinner').show();
    var stackId = $stateParams.id;

    StackService.stack(stackId)
    .then(function success(data) {
      var stack = data;
      $scope.stack = stack;

      var serviceFilters = {
        label: ['com.docker.stack.namespace=' + stack.Name]
      };

      return $q.all({
        services: ServiceService.services(serviceFilters),
        nodes: NodeService.nodes()
      });
    })
    .then(function success(data) {
      $scope.nodes = data.nodes;
      var services = data.services;
      $scope.services = services;
      var tasks = [];
      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        tasks = tasks.concat(service.Tasks);
      }
      $scope.tasks = tasks;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve tasks details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });

    // $q.all({
    //   stack: StackService.stackV3(stackName),
    //   nodes: NodeService.nodes()
    // })
    // .then(function success(data) {
    //   var stack = data.stack;
    //   $scope.nodes = data.nodes;
    //   $scope.stack = stack;
    //   var tasks = [];
    //   for (var i = 0; i < stack.Services.length; i++) {
    //     var service = stack.Services[i];
    //     tasks = tasks.concat(service.Tasks);
    //   }
    //   $scope.tasks = tasks;
    // })
    // .catch(function error(err) {
    //   Notifications.error('Failure', err, 'Unable to retrieve tasks details');
    // })
    // .finally(function final() {
    //   $('#loadingViewSpinner').hide();
    // });
  }

  initView();
}]);
