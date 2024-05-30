import moment from 'moment';

import { UpdatePayload } from '../../queries/useUpdateEdgeJobMutation';

import { FormValues } from './types';

export function getPayload(values: FormValues): UpdatePayload {
  return {
    name: values.name,
    edgeGroups: values.edgeGroupIds,
    endpoints: values.environmentIds,
    ...getRecurringConfig(values),
    fileContent: values.fileContent,
  };

  function getRecurringConfig(values: FormValues): {
    recurring: boolean;
    cronExpression: string;
  } {
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
}
