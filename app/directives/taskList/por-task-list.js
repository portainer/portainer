angular.module('portainer').component('porTaskList', {
  templateUrl: 'app/directives/taskList/porTaskList.html',
  controller: 'porTaskListController',
  bindings: {
    'tasks': '<',
    'nodes': '<'
  }
});
