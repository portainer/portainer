angular.module('portainer.app').component('scheduleForm', {
  templateUrl: 'app/portainer/components/forms/schedule-form/scheduleForm.html',
  controller: function() {
    var ctrl = this;

    ctrl.state = {
      formValidationError: ''
    };

    this.action = function() {
      ctrl.state.formValidationError = '';

      if (ctrl.model.Job.Method === 'editor' && ctrl.model.Job.FileContent === '') {
        ctrl.state.formValidationError = 'Script file content must not be empty';
        return;
      }

      ctrl.formAction();
    };

    this.editorUpdate = function(cm) {
      ctrl.model.Job.FileContent = cm.getValue();
    };
  },
  bindings: {
    model: '=',
    endpoints: '<',
    groups: '<',
    addLabelAction: '<',
    removeLabelAction: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
