import { useFormikContext } from 'formik';

import { SwitchField } from '@@/form-components/SwitchField';

import { FormValues } from '../../CreateView/types';

import { RecurringFieldset, defaultCronExpression } from './RecurringFieldset';
import { ScheduledDateFieldset } from './ScheduledDateFieldset';

export function BasicCronFieldset() {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Recurring Edge job"
            checked={values.recurring}
            onChange={(value) => {
              setFieldValue('recurring', value);
              if (value) {
                setFieldValue('recurringOption', defaultCronExpression);
              }
            }}
            data-cy="edgeJobCreate-recurringSwitch"
          />
        </div>
      </div>
      {values.recurring ? <RecurringFieldset /> : <ScheduledDateFieldset />}
    </>
  );
}
