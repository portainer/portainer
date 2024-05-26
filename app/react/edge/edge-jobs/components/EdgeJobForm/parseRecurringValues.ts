import moment from 'moment';

import { defaultCronExpression, timeOptions } from './RecurringFieldset';

interface RecurringViewModel {
  cronMethod: 'basic' | 'advanced';
  cronExpression: string;
  recurring: boolean;
  recurringOption: (typeof timeOptions)[number]['value'];
  dateTime: Date;
}

interface RecurringRequestModel {
  recurring: boolean;
  cronExpression: string;
}

export function toRecurringRequest(
  values: RecurringViewModel
): RecurringRequestModel {
  if (values.cronMethod !== 'basic') {
    return {
      recurring: true,
      cronExpression: values.cronExpression,
    };
  }

  if (values.recurring) {
    return {
      recurring: true,
      cronExpression: values.recurringOption,
    };
  }

  return {
    recurring: false,
    cronExpression: dateTimeToCron(values.dateTime),
  };

  function dateTimeToCron(datetime: Date) {
    const date = moment(datetime);
    return [
      date.minutes(),
      date.hours(),
      date.date(),
      date.month() + 1,
      '*',
    ].join(' ');
  }
}

export function toRecurringViewModel(
  { cronExpression, recurring }: RecurringRequestModel = {
    cronExpression: defaultCronExpression,
    recurring: true,
  }
): RecurringViewModel {
  const defaultTime = moment().add('hours', 1);
  const scheduled = timeOptions.find((v) => v.value === cronExpression);

  return {
    recurring,
    cronExpression,
    recurringOption: scheduled?.value || defaultCronExpression,
    cronMethod: recurring && !scheduled ? 'advanced' : 'basic',
    dateTime: cronExpression
      ? cronToDateTime(cronExpression, defaultTime).toDate()
      : defaultTime.toDate(),
  };
}

function cronToDateTime(cron: string, defaultTime: moment.Moment) {
  const strings = cron.split(' ');
  if (strings.length > 4) {
    return moment(cron, 'm H D M');
  }

  return defaultTime;
}
