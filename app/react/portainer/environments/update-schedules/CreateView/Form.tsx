import { useFormikContext, Field, Form as FormikForm } from 'formik';

import { LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { NavTabs } from '@@/NavTabs';

import { ScheduleType } from '../types';

import { EdgeGroupsField } from './EdgeGroupsField';
import { FormValues } from './types';

export function Form({ isLoading }: { isLoading: boolean }) {
  const { setFieldValue, errors, values, isValid } =
    useFormikContext<FormValues>();

  return (
    <FormikForm className="form-horizontal">
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

      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            disabled={!isValid}
            isLoading={isLoading}
            loadingText="Creating..."
          >
            Create Schedule
          </LoadingButton>
        </div>
      </div>
    </FormikForm>
  );
}

function UpgradeForm() {
  return <div />;
}

function RollbackForm() {
  return <div />;
}
