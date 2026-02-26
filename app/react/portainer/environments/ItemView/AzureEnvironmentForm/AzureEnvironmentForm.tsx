import { Form, Formik } from 'formik';

import { Environment } from '@/react/portainer/environments/types';
import { useUpdateEnvironmentMutation } from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import { NameField } from '@/react/portainer/environments/common/NameField/NameField';

import { FormSection } from '@@/form-components/FormSection';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget';

import { EnvironmentFormActions } from '../EnvironmentFormActions/EnvironmentFormActions';
import { EnvironmentUrlField } from '../../common/EnvironmentUrlField/EnvironmentUrlField';
import { MetadataFieldset } from '../../common/MetadataFieldset';

import { AzureEndpointConfigSection } from './AzureEndpointConfigSection/AzureEndpointConfigSection';
import { AzureEnvironmentFormValues } from './types';
import { useAzureValidation } from './validation';

interface Props {
  environment: Environment;
  onSuccess: () => void;
}

export function AzureEnvironmentForm({ environment, onSuccess }: Props) {
  const mutation = useUpdateEnvironmentMutation();
  const validation = useAzureValidation({
    environmentId: environment.Id,
  });

  const initialValues: AzureEnvironmentFormValues = {
    name: environment.Name,
    environmentUrl: environment.URL,
    azure: {
      applicationId: environment.AzureCredentials?.ApplicationID || '',
      tenantId: environment.AzureCredentials?.TenantID || '',
      authenticationKey: environment.AzureCredentials?.AuthenticationKey || '',
    },
    meta: {
      groupId: environment.GroupId,
      tagIds: environment.TagIds || [],
    },
  };

  return (
    <Widget>
      <WidgetBody>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validation}
          validateOnMount
          enableReinitialize
        >
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="form-horizontal">
              <FormSection title="Configuration">
                <NameField />

                <EnvironmentUrlField disabled optional />
              </FormSection>

              <AzureEndpointConfigSection
                values={values.azure}
                setValues={(azure: typeof values.azure) =>
                  setFieldValue('azure', azure)
                }
              />

              <MetadataFieldset />

              <EnvironmentFormActions
                isLoading={isSubmitting}
                isValid={isValid}
                isDirty={dirty}
              />
            </Form>
          )}
        </Formik>
      </WidgetBody>
    </Widget>
  );

  function handleSubmit(values: AzureEnvironmentFormValues) {
    mutation.mutate(
      {
        id: environment.Id,
        payload: {
          Name: values.name,
          GroupID: values.meta.groupId,
          TagIds: values.meta.tagIds,
          AzureApplicationID: values.azure.applicationId || undefined,
          AzureTenantID: values.azure.tenantId || undefined,
          AzureAuthenticationKey: values.azure.authenticationKey || undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  }
}
