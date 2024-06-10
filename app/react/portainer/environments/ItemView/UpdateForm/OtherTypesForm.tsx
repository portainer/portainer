import { Form, Formik } from 'formik';

import { FormSection } from '@@/form-components/FormSection';
import { TLSFieldset } from '@@/TLSFieldset';
import { TLSConfig } from '@@/TLSFieldset/types';

import { Environment, EnvironmentType } from '../../types';
import { NameField } from '../../common/NameField';
import { isDockerAPIEnvironment, isLocalEnvironment } from '../../utils';
import { MetadataFieldset } from '../../common/MetadataFieldset';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '../../queries/useUpdateEnvironmentMutation';
import { EnvironmentMetadata } from '../../environment.service/create';

import { URLField } from './URLField';
import { PublicIPField } from './PublicIPField';
import { EnvironmentFormActions } from './EnvironmentFormActions';

export interface FormValues {
  name: string;
  url: string;
  publicUrl: string;
  tlsConfig: TLSConfig;
  meta: EnvironmentMetadata;
}

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

export function useUpdateMutation(
  environment: Environment,
  onSuccessUpdate: (name: string) => void,
  {
    isDockerApi,
    isLocal,
  }: {
    isDockerApi: boolean;
    isLocal: boolean;
  }
) {
  const updateMutation = useUpdateEnvironmentMutation();

  return {
    handleSubmit,
    isLoading: updateMutation.isLoading,
  };

  async function handleSubmit(values: FormValues) {
    const payload: UpdateEnvironmentPayload = {
      Name: values.name,
      PublicURL: values.publicUrl,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
    };

    if (!isLocal) {
      payload.URL = `tcp://${values.url}`;

      if (isDockerApi) {
        const { tlsConfig } = values;
        payload.TLS = tlsConfig.tls;
        payload.TLSSkipVerify = tlsConfig.skipVerify || false;
        if (tlsConfig.tls && !tlsConfig.skipVerify) {
          // payload.TLSSkipClientVerify = tlsConfig.skipClientVerify;
          payload.TLSCACert = tlsConfig.caCertFile;
          payload.TLSCert = tlsConfig.certFile;
          payload.TLSKey = tlsConfig.keyFile;
        }
      }
    }

    if (environment.Type === EnvironmentType.KubernetesLocal) {
      payload.URL = `https://${environment.URL}`;
    }

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
