angular.module('portainer.app').component('porEndpointSecurity', {
  templateUrl: './porEndpointSecurity.html',
  controller: 'porEndpointSecurityController',
  bindings: {
    // This object will be populated with the form data.
    // Model reference in endpointSecurityModel.js
    formData: '=',
    // The component will use this object to initialize the default values
    // if present.
    endpoint: '<',
  },
});
