import { Field, Form, Formik } from 'formik';
import { useReducer } from 'react';
import { Plug2 } from 'lucide-react';

import { useCreateRemoteEnvironmentMutation } from '@/react/portainer/environments/queries/useCreateEnvironmentMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  Environment,
  EnvironmentCreationTypes,
} from '@/react/portainer/environments/types';
import { TLSFieldset } from '@/react/components/TLSFieldset/TLSFieldset';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { NameField } from '../../shared/NameField';
import { MoreSettingsSection } from '../../shared/MoreSettingsSection';

import { useValidation } from './APIForm.validation';
import { FormValues } from './types';

interface Props {
  onCreate(environment: Environment): void;
}

export function APIForm({ onCreate }: Props) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);
  const initialValues: FormValues = {
    url: '',
    name: '',
    tlsConfig: {
      tls: false,
      skipVerify: false,
    },
    meta: {
      groupId: 1,
      tagIds: [],
    },
  };

  const mutation = useCreateRemoteEnvironmentMutation(
    EnvironmentCreationTypes.LocalDockerEnvironment
  );

  const validation = useValidation();

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
      key={formKey}
    >
      {({ values, errors, setFieldValue, isValid, dirty }) => (
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

          <TLSFieldset
            values={values.tlsConfig}
            onChange={(value) =>
              Object.entries(value).forEach(([key, value]) =>
                setFieldValue(`tlsConfig.${key}`, value)
              )
            }
            errors={errors.tlsConfig}
          />

          <MoreSettingsSection />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                className="wizard-connect-button vertical-center"
                data-cy="docker-aconnect-button"
                loadingText="Connecting environment..."
                isLoading={mutation.isLoading}
                disabled={!dirty || !isValid}
                icon={Plug2}
              >
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
      if (!values.tlsConfig.tls) {
        return undefined;
      }

      return {
        skipVerify: values.tlsConfig.skipVerify,
        ...getCertFiles(),
      };

      function getCertFiles() {
        if (values.tlsConfig.skipVerify) {
          return {};
        }

        return {
          caCertFile: values.tlsConfig.caCertFile,
          certFile: values.tlsConfig.certFile,
          keyFile: values.tlsConfig.keyFile,
        };
      }
    }
  }
}
