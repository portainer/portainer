import { addHours, getDate, getHours, getMinutes, getMonth } from 'date-fns';
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

  function dateTimeToCron(date: Date) {
    return [
      getMinutes(date),
      getHours(date),
      getDate(date),
      getMonth(date) + 1,
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
  const defaultTime = addHours(new Date(), 1);
  const scheduled = timeOptions.find((v) => v.value === cronExpression);

  return {
    recurring,
    cronExpression,
    recurringOption: scheduled?.value || defaultCronExpression,
    cronMethod: recurring && !scheduled ? 'advanced' : 'basic',
    dateTime: cronExpression
      ? cronToDateTime(cronExpression, defaultTime)
      : defaultTime,
  };
}

function cronToDateTime(cron: string, defaultTime: Date): Date {
  const strings = cron.split(' ');
  if (strings.length > 4) {
    return moment(cron, 'm H D M').toDate();
  }

  return defaultTime;
}
