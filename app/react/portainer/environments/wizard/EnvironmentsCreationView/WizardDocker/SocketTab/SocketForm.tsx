import { Field, Form, Formik, useFormikContext } from 'formik';
import { useReducer } from 'react';

import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { useCreateLocalDockerEnvironmentMutation } from '@/portainer/environments/queries/useCreateEnvironmentMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';
import { Environment } from '@/portainer/environments/types';

import { NameField } from '../../shared/NameField';
import { MetadataFieldset } from '../../shared/MetadataFieldset';

import { validation } from './SocketForm.validation';
import { FormValues } from './types';

interface Props {
  onCreate(environment: Environment): void;
}

export function SocketForm({ onCreate }: Props) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);
  const initialValues: FormValues = {
    name: '',
    socketPath: '',
    overridePath: false,
    meta: { groupId: 1, tagIds: [] },
  };

  const mutation = useCreateLocalDockerEnvironmentMutation();

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
      key={formKey}
    >
      {({ isValid, dirty }) => (
        <Form>
          <NameField />

          <OverrideSocketFieldset />

          <MetadataFieldset />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                className="wizard-connect-button"
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
  );

  function handleSubmit(values: FormValues) {
    mutation.mutate(
      {
        name: values.name,
        socketPath: values.overridePath ? values.socketPath : '',
      },
      {
        onSuccess(environment) {
          notifySuccess('Environment created', environment.Name);
          clearForm();
          onCreate(environment);
        },
      }
    );
  }
}

function OverrideSocketFieldset() {
  const { values, setFieldValue, errors } = useFormikContext<FormValues>();

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.overridePath}
            onChange={(checked) => setFieldValue('overridePath', checked)}
            label="Override default socket path"
          />
        </div>
      </div>
      {values.overridePath && (
        <FormControl
          label="Socket Path"
          tooltip="Path to the Docker socket. Remember to bind-mount the socket, see the important notice above for more information."
          errors={errors.socketPath}
        >
          <Field
            name="socketPath"
            as={Input}
            placeholder="e.g. /var/run/docker.sock (on Linux) or //./pipe/docker_engine (on Windows)"
          />
        </FormControl>
      )}
    </>
  );
}
