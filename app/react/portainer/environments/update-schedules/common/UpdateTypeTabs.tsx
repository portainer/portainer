import { useField } from 'formik';
import { number } from 'yup';

import { NavTabs } from '@@/NavTabs';

import { ScheduleType } from '../types';

import { FormValues } from './types';
import { ScheduledTimeField } from './ScheduledTimeField';

interface Props {
  disabled?: boolean;
}

export function UpdateTypeTabs({ disabled }: Props) {
  const [{ value }, , { setValue }] = useField<FormValues['type']>('type');

  return (
    <div className="form-group">
      <div className="col-sm-12">
        <NavTabs
          options={[
            {
              id: ScheduleType.Update,
              label: 'Update',
              children: <ScheduleDetails disabled={disabled} />,
            },
            {
              id: ScheduleType.Rollback,
              label: 'Rollback',
              children: <ScheduleDetails disabled={disabled} />,
            },
          ]}
          selectedId={value}
          onSelect={(value) => setValue(value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ScheduleDetails({ disabled }: Props) {
  return (
    <div>
      <ScheduledTimeField disabled={disabled} />
    </div>
  );
}

export function typeValidation() {
  return number()
    .oneOf([ScheduleType.Rollback, ScheduleType.Update])
    .default(ScheduleType.Update);
}
