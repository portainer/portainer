angular.module('portainer.docker').component('networkMacvlanForm', {
  templateUrl: 'app/docker/components/network-macvlan-form/networkMacvlanForm.html',
  controller: 'NetworkMacvlanFormController',
  bindings: {
    data: '=',
    applicationState: '<'
  }
});