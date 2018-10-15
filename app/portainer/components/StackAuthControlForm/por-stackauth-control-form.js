angular.module('portainer.app').component('porStackauthControlForm', {
  templateUrl: 'app/portainer/components/StackAuthControlForm/porStackauthControlForm.html',
  controller: 'porStackauthControlFormController',
  bindings: {
    // This object will be populated with the form data.
    // Model reference in porStackauthControlFromModel.js
    formData: '=',
    // Optional. An existing resource control object that will be used to set
    // the default values of the component.
    resourceControl: '<'
    
  }
});
