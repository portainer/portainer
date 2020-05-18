import angular from 'angular';
import _ from 'lodash-es';
import moment from 'moment';

class EdgeJobFormController {
  /* @ngInject */
  constructor() {
    this.state = {
      formValidationError: '',
    };

    this.scheduleValues = [
      {
        displayed: 'Every hour',
        cron: '0 * * * *',
      },
      {
        displayed: 'Every 2 hours',
        cron: '0 */2 * * *',
      },
      {
        displayed: 'Every day',
        cron: '0 0 * * *',
      },
    ];

    this.formValues = {
      datetime: moment(),
      scheduleValue: this.scheduleValues[0],
      cronMethod: 'basic',
      endpointIds: [],
    };

    this.onChangeModel(this.model);

    this.action = this.action.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
  }

  // $onChange({ model }) {
  //   if (!model.currentValue) {
  //     return;
  //   }
  //   this.onChangeModel(model.currentValue);
  // }

  onChangeModel(model) {
    this.formValues = {
      datetime: model.CronExpression ? cronToDatetime(model.CronExpression) : moment(),
      scheduleValue: this.formValues.scheduleValue,
      cronMethod: model.Recurring ? 'advanced' : 'basic',
      endpointIds: model.Job && model.Job.Endpoints ? model.Job.Endpoints : [],
    };
  }

  action() {
    this.state.formValidationError = '';

    if (this.model.Job.Method === 'editor' && this.model.Job.FileContent === '') {
      this.state.formValidationError = 'Script file content must not be empty';
      return;
    }

    if (this.formValues.cronMethod === 'basic') {
      if (this.model.Recurring === false) {
        this.model.CronExpression = datetimeToCron(this.formValues.datetime);
      } else {
        this.model.CronExpression = this.formValues.scheduleValue.cron;
      }
    } else {
      this.model.Recurring = true;
    }

    this.model.Job.Endpoints = this.formValues.endpointIds;

    this.formAction();
  }

  editorUpdate(cm) {
    this.model.Job.FileContent = cm.getValue();
  }

  associateEndpoint(endpoint) {
    if (!_.includes(this.formValues.endpointIds, endpoint.Id)) {
      this.formValues.endpointIds = [...this.formValues.endpointIds, endpoint.Id];
    }
  }

  dissociateEndpoint(endpoint) {
    this.formValues.endpointIds = _.filter(this.formValues.endpointIds, (id) => id !== endpoint.Id);
  }
}

function cronToDatetime(cron) {
  var strings = cron.split(' ');
  if (strings.length !== 5) {
    return moment();
  }
  return moment(cron, 's m H D M');
}

function datetimeToCron(datetime) {
  var date = moment(datetime);
  return '0 '.concat(date.minutes(), ' ', date.hours(), ' ', date.date(), ' ', date.month() + 1, ' *');
}

angular.module('portainer.edge').controller('EdgeJobFormController', EdgeJobFormController);
export default EdgeJobFormController;
