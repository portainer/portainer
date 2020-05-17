import ScheduleFormController from './scheduleFormController';

angular.module('portainer.app').component('scheduleForm', {
  templateUrl: './scheduleForm.html',
  controller: ScheduleFormController,
  bindings: {
    model: '=',
    endpoints: '<',
    groups: '<',
    tags: '<',
    addLabelAction: '<',
    removeLabelAction: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
