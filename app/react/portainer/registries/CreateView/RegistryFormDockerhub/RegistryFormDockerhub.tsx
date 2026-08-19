import { Formik, Form } from 'formik';
import { SchemaOf, object, string } from 'yup';
import { useState } from 'react';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { FormActions } from '@@/form-components/FormActions';

import { RegistryTestConnection } from '../TestConnection/RegistryTestConnection';

export interface RegistryFormDockerhubValues {
  Name: string;
  Username: string;
  Password: string;
}

interface Props {
  initialValues: RegistryFormDockerhubValues;
  onSubmit: (values: RegistryFormDockerhubValues) => void | Promise<void>;
  submitLabel: string;
  isLoading: boolean;
  nameIsUsed: (name: string) => Promise<boolean>;
}

export function RegistryFormDockerhub({
  initialValues,
  onSubmit,
  submitLabel,
  isLoading,
  nameIsUsed,
}: Props) {
  const [isConnectionTested, setIsConnectionTested] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={() => validationSchema(nameIsUsed)}
      onSubmit={handleSubmit}
      enableReinitialize
      validateOnMount
    >
      {({ errors, isValid, values, setFieldValue }) => (
        <Form className="form-horizontal">
          <FormSection title="Important notice">
            <TextTip color="blue">
              <p>
                For information on how to generate a DockerHub Access Token,
                follow the{' '}
                <a
                  href="https://docs.docker.com/security/access-tokens/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  dockerhub guide
                </a>
                .
              </p>
            </TextTip>
          </FormSection>

          <FormSection title="DockerHub account details">
            <FormControl
              label="Name"
              inputId="registry_name"
              errors={errors.Name}
              required
            >
              <Input
                id="registry_name"
                name="Name"
                placeholder="dockerhub-prod-us"
                data-cy="component-registryName"
                value={values.Name}
                onChange={(event) => {
                  setIsConnectionTested(false);
                  setFieldValue('Name', event.target.value);
                }}
              />
            </FormControl>

            <FormControl
              label="DockerHub username"
              inputId="registry_username"
              errors={errors.Username}
              required
            >
              <Input
                id="registry_username"
                name="Username"
                data-cy="component-registryUsername"
                value={values.Username}
                onChange={(event) => {
                  setIsConnectionTested(false);
                  setFieldValue('Username', event.target.value);
                }}
              />
            </FormControl>

            <FormControl
              label="DockerHub access token"
              inputId="registry_password"
              errors={errors.Password}
              required
            >
              <Input
                id="registry_password"
                name="Password"
                type="password"
                data-cy="component-registryPassword"
                value={values.Password}
                onChange={(event) => {
                  setIsConnectionTested(false);
                  setFieldValue('Password', event.target.value);
                }}
              />
            </FormControl>
          </FormSection>

          <RegistryTestConnection
            values={values}
            onTestSuccess={() => setIsConnectionTested(true)}
            disabled={!isValid}
            isConnectionTested={isConnectionTested}
          />

          <FormActions
            isLoading={isLoading}
            isValid={isValid && isConnectionTested}
            submitLabel={submitLabel}
            errors={errors}
            loadingText="In progress..."
            data-cy="registry-form-submit"
          />
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: RegistryFormDockerhubValues) {
    return onSubmit(values);
  }
}

function validationSchema(
  nameIsUsed: (name: string) => Promise<boolean>
): SchemaOf<RegistryFormDockerhubValues> {
  return object({
    Name: string()
      .required('This field is required.')
      .test(
        'name-not-used',
        'A registry with the same name already exists.',
        async (name) => !(await nameIsUsed(name || ''))
      ),
    Username: string().required('This field is required.'),
    Password: string().required('This field is required.'),
  });
}
