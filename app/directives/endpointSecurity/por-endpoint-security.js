angular.module('portainer').component('porEndpointSecurity', {
  templateUrl: 'app/directives/endpointSecurity/porEndpointSecurity.html',
  controller: 'porEndpointSecurityController',
  bindings: {
    // This object will be populated with the form data.
    // Model reference in endpointSecurityModel.js
    formData: '=',
    // The component will use this object to initialize the default values
    // if present.
    endpoint: '<'
  }
});
