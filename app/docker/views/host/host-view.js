import angular from 'angular';

angular.module('portainer.docker').component('hostView', {
  templateUrl: './host-view.html',
  controller: 'HostViewController'
});
