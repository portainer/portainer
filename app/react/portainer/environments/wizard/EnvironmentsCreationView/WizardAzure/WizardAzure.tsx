import { Field, Form, Formik } from 'formik';
import { useReducer, useState } from 'react';
import { object, SchemaOf, string } from 'yup';

import { useCreateAzureEnvironmentMutation } from '@/react/portainer/environments/queries/useCreateEnvironmentMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import { Environment } from '@/react/portainer/environments/types';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';
import Dataflow2 from '@/assets/ico/dataflow-2.svg?c';
import Plug from '@/assets/ico/plug.svg?c';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { BoxSelector } from '@@/BoxSelector';
import { Icon } from '@@/Icon';
import { BadgeIcon } from '@@/BadgeIcon';

import { NameField, useNameValidation } from '../shared/NameField';
import { AnalyticsStateKey } from '../types';
import { metadataValidation } from '../shared/MetadataFieldset/validation';
import { MoreSettingsSection } from '../shared/MoreSettingsSection';

interface FormValues {
  name: string;
  applicationId: string;
  tenantId: string;
  authenticationKey: string;
  meta: EnvironmentMetadata;
}

const initialValues: FormValues = {
  name: '',
  applicationId: '',
  tenantId: '',
  authenticationKey: '',
  meta: {
    groupId: 1,
    tagIds: [],
  },
};

const options = [
  {
    description: '',
    icon: <BadgeIcon icon={Dataflow2} size="3xl" />,
    id: 'api',
    label: 'API',
    value: 'api',
  },
];

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

export function WizardAzure({ onCreate }: Props) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  const [creationType, setCreationType] = useState(options[0].id);
  const mutation = useCreateAzureEnvironmentMutation();
  const validation = useValidation();

  return (
    <div className="form-horizontal">
      <BoxSelector
        options={options}
        radioName="creation-type"
        onChange={(value) => setCreationType(value)}
        value={creationType}
      />

      <Formik<FormValues>
        initialValues={initialValues}
        onSubmit={handleSubmit}
        key={formKey}
        validateOnMount
        validationSchema={validation}
      >
        {({ errors, dirty, isValid }) => (
          <Form>
            <NameField />

            <FormControl
              label="Application ID"
              errors={errors.applicationId}
              inputId="applicationId-input"
              required
            >
              <Field
                name="applicationId"
                id="applicationId-input"
                as={Input}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </FormControl>

            <FormControl
              label="Tenant ID"
              errors={errors.tenantId}
              inputId="tenantId-input"
              required
            >
              <Field
                name="tenantId"
                id="tenantId-input"
                as={Input}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </FormControl>

            <FormControl
              label="Authentication Key"
              errors={errors.authenticationKey}
              inputId="authenticationKey-input"
              required
            >
              <Field
                name="authenticationKey"
                id="authenticationKey-input"
                as={Input}
                placeholder="cOrXoK/1D35w8YQ8nH1/8ZGwzz45JIYD5jxHKXEQknk="
              />
            </FormControl>

            <MoreSettingsSection />

            <div className="row">
              <div className="col-sm-12">
                <LoadingButton
                  className="vertical-center"
                  loadingText="Connecting environment..."
                  isLoading={mutation.isLoading}
                  disabled={!dirty || !isValid}
                >
                  <Icon icon={Plug} className="icon icon-sm vertical-center" />{' '}
                  Connect
                </LoadingButton>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );

  function handleSubmit({
    applicationId,
    authenticationKey,
    meta,
    name,
    tenantId,
  }: typeof initialValues) {
    mutation.mutate(
      {
        name,
        azure: {
          applicationId,
          authenticationKey,
          tenantId,
        },
        meta,
      },
      {
        onSuccess(environment) {
          notifySuccess('Environment created', environment.Name);
          clearForm();
          onCreate(environment, 'aciApi');
        },
      }
    );
  }
}

function useValidation(): SchemaOf<FormValues> {
  return object({
    name: useNameValidation(),
    applicationId: string().required('Application ID is required'),
    tenantId: string().required('Tenant ID is required'),
    authenticationKey: string().required('Authentication Key is required'),
    meta: metadataValidation(),
  });
}
