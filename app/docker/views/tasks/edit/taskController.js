angular.module('portainer.docker')
.controller('TaskController', ['$scope', '$transition$', 'TaskService', 'Service', 'Notifications',
function ($scope, $transition$, TaskService, Service, Notifications) {

  function initView() {
    TaskService.task($transition$.params().id)
    .then(function success(data) {
      var task = data;
      $scope.task = task;
      return Service.get({ id: task.ServiceId }).$promise;
    })
    .then(function success(data) {
      var service = new ServiceViewModel(data);
      $scope.service = service;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve task details');
    });
  }

  initView();
}]);
