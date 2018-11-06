angular.module('portainer.app').component('scheduleForm', {
  templateUrl: 'app/portainer/components/forms/schedule-form/scheduleForm.html',
  controller: function() {
    var ctrl = this;

    this.editorUpdate = function(cm) {
      ctrl.model.FileContent = cm.getValue();
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
