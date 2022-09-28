import { Field, Form, Formik } from 'formik';
import { useReducer } from 'react';

import { useCreateRemoteEnvironmentMutation } from '@/react/portainer/environments/queries/useCreateEnvironmentMutation';
import { Hardware } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/Hardware';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  Environment,
  EnvironmentCreationTypes,
} from '@/react/portainer/environments/types';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { Icon } from '@@/Icon';

import { NameField } from '../../shared/NameField';
import { MoreSettingsSection } from '../../shared/MoreSettingsSection';

import { validation } from './APIForm.validation';
import { FormValues } from './types';
import { TLSFieldset } from './TLSFieldset';

interface Props {
  onCreate(environment: Environment): void;
}

export function APIForm({ onCreate }: Props) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);
  const initialValues: FormValues = {
    url: '',
    name: '',
    tls: false,
    meta: {
      groupId: 1,
      tagIds: [],
    },
    gpus: [],
  };

  const mutation = useCreateRemoteEnvironmentMutation(
    EnvironmentCreationTypes.LocalDockerEnvironment
  );

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

          <FormControl
            inputId="url-field"
            label="Docker API URL"
            required
            tooltip="URL or IP address of a Docker host. The Docker API must be exposed over a TCP port. Please refer to the Docker documentation to configure it."
          >
            <Field
              as={Input}
              id="url-field"
              name="url"
              placeholder="e.g. 10.0.0.10:2375 or mydocker.mydomain.com:2375"
            />
          </FormControl>

          <TLSFieldset />

          <MoreSettingsSection>
            <Hardware />
          </MoreSettingsSection>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                className="wizard-connect-button vertical-center"
                loadingText="Connecting environment..."
                isLoading={mutation.isLoading}
                disabled={!dirty || !isValid}
              >
                <Icon
                  icon="svg-plug"
                  className="icon icon-sm vertical-center"
                />{' '}
                Connect
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    const tls = getTlsValues();

    mutation.mutate(
      {
        name: values.name,
        url: values.url,
        options: {
          tls,
          meta: values.meta,
          gpus: values.gpus,
        },
      },
      {
        onSuccess(environment) {
          notifySuccess('Environment created', environment.Name);
          clearForm();
          onCreate(environment);
        },
      }
    );
    function getTlsValues() {
      if (!values.tls) {
        return undefined;
      }

      return {
        skipVerify: values.skipVerify,
        ...getCertFiles(),
      };

      function getCertFiles() {
        if (values.skipVerify) {
          return {};
        }

        return {
          caCertFile: values.caCertFile,
          certFile: values.certFile,
          keyFile: values.keyFile,
        };
      }
    }
  }
}
