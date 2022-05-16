import { Field, Form, Formik } from 'formik';
import { useReducer, useState } from 'react';
import { object, string } from 'yup';

import { BoxSelector, buildOption } from '@/portainer/components/BoxSelector';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { useCreateAzureEnvironmentMutation } from '@/portainer/environments/queries/useCreateEnvironmentMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import { Environment } from '@/portainer/environments/types';

import { NameField } from '../shared/NameField';
import { AnalyticsStateKey } from '../types';

const initialValues = {
  name: '',
  applicationId: '',
  tenantId: '',
  authKey: '',
};

const options = [buildOption('api', 'fa fa-bolt', 'API', '', 'api')];

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

export function WizardAzure({ onCreate }: Props) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  const [creationType, setCreationType] = useState(options[0].id);
  const mutation = useCreateAzureEnvironmentMutation();

  return (
    <div className="form-horizontal">
      <BoxSelector
        options={options}
        radioName="creation-type"
        onChange={(value) => setCreationType(value)}
        value={creationType}
      />

      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        key={formKey}
        validateOnMount
        validationSchema={validationSchema}
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
              errors={errors.authKey}
              inputId="authKey-input"
              required
            >
              <Field
                name="authKey"
                id="authKey-input"
                as={Input}
                placeholder="cOrXoK/1D35w8YQ8nH1/8ZGwzz45JIYD5jxHKXEQknk="
              />
            </FormControl>

            <div className="row">
              <div className="col-sm-12">
                <LoadingButton
                  loadingText="Connecting environment..."
                  isLoading={mutation.isLoading}
                  disabled={!dirty || !isValid}
                >
                  <i className="fa fa-plug" aria-hidden="true" /> Connect
                </LoadingButton>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );

  function handleSubmit(values: typeof initialValues) {
    mutation.mutate(
      {
        name: values.name,
        azure: {
          applicationId: values.applicationId,
          authenticationKey: values.authKey,
          tenantId: values.tenantId,
        },
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

function validationSchema() {
  return object({
    name: string().required('Name is required'),
    applicationId: string().required('Application ID is required'),
    tenantId: string().required('Tenant ID is required'),
    authKey: string().required('Authentication Key is required'),
  });
}
