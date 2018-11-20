angular.module('portainer.app').component('scheduleForm', {
  templateUrl: 'app/portainer/components/forms/schedule-form/scheduleForm.html',
  controller: function() {
    var ctrl = this;

    ctrl.state = {
      formValidationError: ''
    };

    ctrl.formValues = {
      datetime: '',
      scheduleValue: '',
      recurring: false,
      cronMethod: 'basic'
    };

    ctrl.scheduleValues = [{
        displayed: 'Every hour',
        cron: '@hourly'
      },
      {
        displayed: 'Every 2 hours',
        cron: '<@every 2h'
      }, {
        displayed: 'Every day',
        cron: '@daily'
      }
    ];

    function datetimeToCron(datetime) {

    }

    this.action = function() {
      ctrl.state.formValidationError = '';

      if (ctrl.model.Job.Method === 'editor' && ctrl.model.Job.FileContent === '') {
        ctrl.state.formValidationError = 'Script file content must not be empty';
        return;
      }

      if (ctrl.formValues.cronMethod === 'basic') {
        if (!ctrl.formValues.recurring) {
          ctrl.model.CronExpression = datetimeToCron(ctrl.model.datetime);
        } else {
          ctrl.model.CronExpression = ctrl.formValues.scheduleValue.cron;
        }
      }
      console.log(ctrl.model.CronExpression);
      return;
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
