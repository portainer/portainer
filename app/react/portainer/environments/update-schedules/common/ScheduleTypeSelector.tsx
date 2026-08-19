import { useFormikContext } from 'formik';
import { number } from 'yup';
import { useEffect } from 'react';

import { NavTabs } from '@@/NavTabs';
import { NavContainer } from '@@/NavTabs/NavContainer';

import { ScheduleType } from '../types';

import { useEnvironments } from './useEnvironments';
import { defaultValue } from './ScheduledTimeField';
import { FormValues } from './types';
import { UpdateScheduleDetailsFieldset } from './UpdateScheduleDetailsFieldset';
import { RollbackScheduleDetailsFieldset } from './RollbackScheduleDetailsFieldset';

export function ScheduleTypeSelector() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  const environments = useEnvironments(values.groupIds);

  // old version is version that doesn't support scheduling of updates
  const hasNoTimeZone = environments.some((env) => !env.LocalTimeZone);
  const hasTimeZone = environments.some((env) => env.LocalTimeZone);
  const hasGroupSelected = values.groupIds.length > 0;

  useEffect(() => {
    if (!hasTimeZone || !hasGroupSelected) {
      setFieldValue('scheduledTime', '');
    } else if (!values.scheduledTime) {
      setFieldValue('scheduledTime', defaultValue());
    }
  }, [setFieldValue, hasTimeZone, values.scheduledTime, hasGroupSelected]);

  return (
    <div className="form-group">
      <div className="col-sm-12">
        <NavContainer>
          <NavTabs
            options={[
              {
                id: ScheduleType.Update,
                label: 'Update',
                children: (
                  <UpdateScheduleDetailsFieldset
                    environments={environments}
                    hasTimeZone={hasTimeZone}
                    hasNoTimeZone={hasNoTimeZone}
                    hasGroupSelected={hasGroupSelected}
                    version={values.version}
                  />
                ),
              },
              {
                id: ScheduleType.Rollback,
                label: 'Rollback',
                children: (
                  <RollbackScheduleDetailsFieldset
                    hasTimeZone={hasTimeZone}
                    hasGroupSelected={hasGroupSelected}
                  />
                ),
              },
            ]}
            selectedId={values.type}
            onSelect={handleChangeType}
          />
        </NavContainer>
      </div>
    </div>
  );

  function handleChangeType(scheduleType: ScheduleType) {
    setFieldValue('type', scheduleType);
    setFieldValue('version', '');
  }
}

export function typeValidation() {
  return number()
    .oneOf([ScheduleType.Rollback, ScheduleType.Update])
    .default(ScheduleType.Update);
}
