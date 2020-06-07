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
      method: 'editor',
    };

    this.onChangeModel(this.model);

    this.action = this.action.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
  }

  onChangeModel(model) {
    this.formValues = {
      datetime: model.CronExpression ? cronToDatetime(model.CronExpression) : moment(),
      scheduleValue: this.formValues.scheduleValue,
      cronMethod: model.Recurring ? 'advanced' : 'basic',
      method: this.formValues.method,
    };
  }

  action() {
    this.state.formValidationError = '';

    if (this.formValues.method === 'editor' && this.model.FileContent === '') {
      this.state.formValidationError = 'Script file content must not be empty';
      return;
    }

    if (this.formValues.cronMethod === 'basic') {
      if (!this.model.Recurring) {
        this.model.CronExpression = datetimeToCron(this.formValues.datetime);
      } else {
        this.model.CronExpression = this.formValues.scheduleValue.cron;
      }
    } else {
      this.model.Recurring = true;
    }

    this.formAction(this.formValues.method);
  }

  editorUpdate(cm) {
    this.model.FileContent = cm.getValue();
  }

  associateEndpoint(endpoint) {
    if (!_.includes(this.model.Endpoints, endpoint.Id)) {
      this.model.Endpoints = [...this.model.Endpoints, endpoint.Id];
    }
  }

  dissociateEndpoint(endpoint) {
    this.model.Endpoints = _.filter(this.model.Endpoints, (id) => id !== endpoint.Id);
  }
}

function cronToDatetime(cron) {
  var strings = cron.split(' ');
  if (strings.length > 4) {
    strings = strings.slice(0, 4);
  } else {
    return moment();
  }
  return moment(cron, 'm H D M');
}

function datetimeToCron(datetime) {
  var date = moment(datetime);
  return [date.minutes(), date.hours(), date.date(), date.month() + 1, '*'].join(' ');
}

angular.module('portainer.edge').controller('EdgeJobFormController', EdgeJobFormController);
export default EdgeJobFormController;
