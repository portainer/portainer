import { useFormikContext } from 'formik';

import { NavTabs } from '@@/NavTabs';

import { ScheduleType } from '../types';

import { EdgeGroupsField } from './EdgeGroupsField';
import { FormValues } from './types';
import { NameField } from './NameField';

export function FormFields() {
  const { setFieldValue, values } = useFormikContext<FormValues>();

  return (
    <>
      <NameField />

      <EdgeGroupsField />

      <div className="form-group">
        <div className="col-sm-12">
          <NavTabs
            options={[
              {
                id: ScheduleType.Upgrade,
                label: 'Upgrade',
                children: <UpgradeForm />,
              },
              {
                id: ScheduleType.Rollback,
                label: 'Rollback',
                children: <RollbackForm />,
              },
            ]}
            selectedId={values.type}
            onSelect={(value) => setFieldValue('type', value)}
          />
        </div>
      </div>
    </>
  );
}

function UpgradeForm() {
  return <div />;
}

function RollbackForm() {
  return <div />;
}
