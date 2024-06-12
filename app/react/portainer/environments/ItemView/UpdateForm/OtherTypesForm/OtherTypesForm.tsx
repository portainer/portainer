import { Form, Formik } from 'formik';

import { Environment } from '@/react/portainer/environments/types';
import { NameField } from '@/react/portainer/environments/common/NameField';
import {
  isDockerAPIEnvironment,
  isLocalEnvironment,
} from '@/react/portainer/environments/utils';
import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset';

import { TLSFieldset } from '@@/TLSFieldset';
import { FormSection } from '@@/form-components/FormSection';

import { URLField } from '../URLField';
import { PublicIPField } from '../PublicIPField';
import { EnvironmentFormActions } from '../EnvironmentFormActions';

import { FormValues } from './types';
import { useUpdateMutation } from './useUpdateMutation';

export function OtherTypesForm({
  environment,
  onSuccessUpdate,
}: {
  environment: Environment;
  onSuccessUpdate: (name: string) => void;
}) {
  const { handleSubmit, isLoading } = useUpdateMutation(
    environment,
    onSuccessUpdate,
    {
      isDockerApi: isDockerAPIEnvironment(environment),
      isLocal: isLocalEnvironment(environment),
    }
  );

  const isLocal = isLocalEnvironment(environment);
  const isDockerApi = isDockerAPIEnvironment(environment);

  const initialValues: FormValues = {
    name: environment.Name,
    url: environment.URL,
    publicUrl: environment.PublicURL || '',

    tlsConfig: {
      tls: environment.TLSConfig.TLS || false,
      skipVerify: environment.TLSConfig.TLSSkipVerify || false,
    },
    meta: {
      tagIds: environment.TagIds,
      groupId: environment.GroupId,
    },
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, errors, setFieldValue, setValues, isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField />
            <URLField
              disabled={isLocal}
              value={values.url}
              onChange={(value) => setFieldValue('url', value)}
              error={errors.url}
            />

            <PublicIPField />
          </FormSection>

          {isDockerApi && (
            <TLSFieldset
              errors={errors.tlsConfig}
              values={values.tlsConfig}
              onChange={(tlsConfig) =>
                setValues((values) => ({
                  ...values,
                  tlsConfig: { ...values.tlsConfig, ...tlsConfig },
                }))
              }
            />
          )}

          <MetadataFieldset />

          <EnvironmentFormActions isLoading={isLoading} isValid={isValid} />
        </Form>
      )}
    </Formik>
  );
}
