angular.module('portainer.app')
.controller('StackDuplicationController', [function StackDuplicationController(){
  var ctrl = this;

  ctrl.state = {

  };

  ctrl.formValues = {
    endpoint: null,
    newName: ''
  };

  ctrl.isFormValid = isFormValid;
  ctrl.duplicateStack = duplicateStack;

  function isFormValid() {
    return ctrl.formValues.endpoint && 
           ctrl.formValues.endpoint.Id &&
           ctrl.formValues.newName; 
  }

  function duplicateStack() {
    ctrl.onDuplicate({
      endpointId: ctrl.formValues.endpoint.Id,
      name: ctrl.formValues.newName,
      stack: ctrl.stack
    });
  }
}]);
