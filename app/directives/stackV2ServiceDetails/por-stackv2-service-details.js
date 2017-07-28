angular.module('portainer').component('porStackv2ServiceDetails', {
  templateUrl: 'app/directives/stackV2ServiceDetails/porStackV2ServiceDetails.html',
  controller: 'porStackV2ServiceDetails',
  bindings: {
    'services': '<',
    'stack': '<'
  }
});
