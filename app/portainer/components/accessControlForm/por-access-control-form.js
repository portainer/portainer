angular.module('portainer.app').component('porAccessControlForm', {
  templateUrl: 'app/portainer/components/accessControlForm/porAccessControlForm.html',
  controller: 'porAccessControlFormController',
  bindings: {
    // This object will be populated with the form data.
    // Model reference in porAccessControlFromModel.js
    formData: '=',
    // Optional. An existing resource control object that will be used to set
    // the default values of the component.
    resourceControl: '<'
  }
});
