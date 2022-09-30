import { useField } from 'formik';
import { number } from 'yup';

import { NavTabs } from '@@/NavTabs';

import { ScheduleType } from '../types';

import { FormValues } from './types';
import { UpdateScheduleDetailsFieldset } from './UpdateScheduleDetailsFieldset';
import { RollbackScheduleDetailsFieldset } from './RollbackScheduleDetailsFieldset';

export function ScheduleTypeSelector() {
  const [{ value }, , { setValue }] = useField<FormValues['type']>('type');

  return (
    <div className="form-group">
      <div className="col-sm-12">
        <NavTabs
          options={[
            {
              id: ScheduleType.Update,
              label: 'Update',
              children: <UpdateScheduleDetailsFieldset />,
            },
            {
              id: ScheduleType.Rollback,
              label: 'Rollback',
              children: <RollbackScheduleDetailsFieldset />,
            },
          ]}
          selectedId={value}
          onSelect={(value) => setValue(value)}
        />
      </div>
    </div>
  );
}

export function typeValidation() {
  return number()
    .oneOf([ScheduleType.Rollback, ScheduleType.Update])
    .default(ScheduleType.Update);
}
