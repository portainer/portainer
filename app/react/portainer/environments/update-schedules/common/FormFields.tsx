import { useFormikContext, Field } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { NavTabs } from '@@/NavTabs';

import { ScheduleType } from '../types';

import { EdgeGroupsField } from './EdgeGroupsField';
import { FormValues } from './types';

export function FormFields() {
  const { setFieldValue, errors, values } = useFormikContext<FormValues>();

  return (
    <>
      <FormControl
        label="Name"
        required
        inputId="name-input"
        errors={errors.name}
      >
        <Field as={Input} name="name" id="name-input" />
      </FormControl>

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
