angular.module('portainer').component('stackServiceDetails', {
  templateUrl: 'app/directives/stackServiceDetails/stackServiceDetails.html',
  controller: 'porStackServiceDetails',
  bindings: {
    'stack': '<'
  }
});
