import { Settings } from 'react-feather';
import { Field, Formik, Form as FormikForm, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRedirectFeatureFlag,
  FeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import { NavTabs } from '@@/NavTabs';

import { ScheduleType } from '../types';
import { useCreateMutation } from '../queries/create';

import { FormValues } from './types';
import { validation } from './validation';
import { EdgeGroupsField } from './EdgeGroupsField';

const initialValues: FormValues = {
  name: '',
  groupIds: [],
  type: ScheduleType.Upgrade,
  version: 'latest',
  time: Date.now() + 60 * 60 * 1000,
};

export function CreateView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);

  const createMutation = useCreateMutation();
  const router = useRouter();
  return (
    <>
      <PageHeader
        title="Upgrade & Rollback"
        breadcrumbs="Edge agent upgrade and rollback"
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title
              title="Upgrade & Rollback Scheduler"
              icon={Settings}
            />
            <Widget.Body>
              <Formik
                initialValues={initialValues}
                onSubmit={(values) => {
                  createMutation.mutate(values, {
                    onSuccess() {
                      notifySuccess('Success', 'Created schedule successfully');
                      router.stateService.go('^');
                    },
                  });
                }}
                validateOnMount
                validationSchema={validation}
              >
                <Form />
              </Formik>
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}

function Form() {
  const { setFieldValue, errors, values, isSubmitting, isValid } =
    useFormikContext<typeof initialValues>();

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
            isLoading={isSubmitting}
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
