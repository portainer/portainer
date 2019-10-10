import moment from 'moment';

angular.module('portainer.app').component('scheduleForm', {
  templateUrl: './scheduleForm.html',
  controller: function() {
    var ctrl = this;

    ctrl.state = {
      formValidationError: ''
    };

    ctrl.scheduleValues = [{
      displayed: 'Every hour',
      cron: '0 * * * *'
    },
      {
        displayed: 'Every 2 hours',
        cron: '0 */2 * * *'
      }, {
        displayed: 'Every day',
        cron: '0 0 * * *'
      }
    ];

    ctrl.formValues = {
      datetime: ctrl.model.CronExpression ? cronToDatetime(ctrl.model.CronExpression) : moment(),
      scheduleValue: ctrl.scheduleValues[0],
      cronMethod: ctrl.model.Recurring ? 'advanced' : 'basic'
    };

    function cronToDatetime(cron) {
      var strings = cron.split(' ');
      if (strings.length !== 5) {
        return moment();
      }
      return moment(cron, 's m H D M');
    }

    function datetimeToCron(datetime) {
      var date = moment(datetime);
      return '0 '.concat(date.minutes(), ' ', date.hours(), ' ', date.date(), ' ', (date.month() + 1), ' *');
    }

    this.action = function() {
      ctrl.state.formValidationError = '';

      if (ctrl.model.Job.Method === 'editor' && ctrl.model.Job.FileContent === '') {
        ctrl.state.formValidationError = 'Script file content must not be empty';
        return;
      }

      if (ctrl.formValues.cronMethod === 'basic') {
        if (ctrl.model.Recurring === false) {
          ctrl.model.CronExpression = datetimeToCron(ctrl.formValues.datetime);
        } else {
          ctrl.model.CronExpression = ctrl.formValues.scheduleValue.cron;
        }
      } else {
        ctrl.model.Recurring = true;
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
