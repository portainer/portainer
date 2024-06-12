import { Form, Formik } from 'formik';

import { NameField } from '@/react/portainer/environments/common/NameField';
import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset';
import { Environment } from '@/react/portainer/environments/types';

import { FormSection } from '@@/form-components/FormSection';

import { URLField } from '../URLField';
import { EnvironmentFormActions } from '../EnvironmentFormActions';

import { AzureEnvironmentConfiguration } from './AzureConfiguration';
import { FormValues } from './types';
import { useUpdateAzureEnvironment } from './useUpdateAzureEnvironment';

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
