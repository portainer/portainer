import { Form, Formik } from 'formik';

import { FormSection } from '@@/form-components/FormSection';

import { NameField } from '../../common/NameField';
import { MetadataFieldset } from '../../common/MetadataFieldset';
import { Environment, EnvironmentId } from '../../types';
import { EnvironmentMetadata } from '../../environment.service/create';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '../../queries/useUpdateEnvironmentMutation';

import { URLField } from './URLField';
import { AzureEnvironmentConfiguration } from './AzureConfiguration';
import { EnvironmentFormActions } from './EnvironmentFormActions';

interface FormValues {
  name: string;

  meta: EnvironmentMetadata;

  applicationId: string;
  tenantId: string;
  authKey: string;
}

export function AzureForm({
  environment,
  onSuccessUpdate,
}: {
  environment: Environment;
  onSuccessUpdate: (name: string) => void;
}) {
  const { handleSubmit, isLoading } = useUpdateAzureEnvironment(
    environment.Id,
    onSuccessUpdate
  );
  const initialValues: FormValues = {
    name: environment.Name,

    meta: {
      tagIds: environment.TagIds,
      groupId: environment.GroupId,
    },

    applicationId: environment.AzureCredentials?.ApplicationID || '',
    tenantId: environment.AzureCredentials?.TenantID || '',
    authKey: environment.AzureCredentials?.AuthenticationKey || '',
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField />
            <URLField disabled value={environment.URL} />
          </FormSection>
          <AzureEnvironmentConfiguration />
          <MetadataFieldset />
          <EnvironmentFormActions isLoading={isLoading} isValid={isValid} />
        </Form>
      )}
    </Formik>
  );
}

function useUpdateAzureEnvironment(
  envId: EnvironmentId,
  onSuccessUpdate: (name: string) => void
) {
  const updateMutation = useUpdateEnvironmentMutation();

  return {
    handleSubmit,
    isLoading: updateMutation.isLoading,
  };

  async function handleSubmit(values: FormValues) {
    const payload: UpdateEnvironmentPayload = {
      Name: values.name,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
      AzureApplicationID: values.applicationId,
      AzureTenantID: values.tenantId,
      AzureAuthenticationKey: values.authKey,
    };

    updateMutation.mutate(
      { id: envId, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
