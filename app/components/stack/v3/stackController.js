angular.module('stackv3', [])
.controller('StackV3Controller', ['$q', '$scope', '$stateParams', 'StackService', 'NodeService', 'Notifications',
function ($q, $scope, $stateParams, StackService, NodeService, Notifications) {

  function initView() {
    $('#loadingViewSpinner').show();
    var stackName = $stateParams.name;

    $q.all({
      stack: StackService.stackV3(stackName),
      nodes: NodeService.nodes()
    })
    .then(function success(data) {
      var stack = data.stack;
      $scope.nodes = data.nodes;
      $scope.stack = stack;
      var tasks = [];
      for (var i = 0; i < stack.Services.length; i++) {
        var service = stack.Services[i];
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
  }

  initView();
}]);
