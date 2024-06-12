import { Form, Formik } from 'formik';

import { Environment } from '@/react/portainer/environments/types';
import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset';
import { NameField } from '@/react/portainer/environments/common/NameField';

import { FormSection } from '@@/form-components/FormSection';

import { EnvironmentFormActions } from '../EnvironmentFormActions';
import { PublicIPField } from '../PublicIPField';

import { AgentAddressField } from './AgentEnvironmentAddress';
import { FormValues } from './types';
import { useUpdateMutation } from './useUpdateMutation';

export function AgentForm({
  environment,
  onSuccessUpdate,
}: {
  environment: Environment;
  onSuccessUpdate: (name: string) => void;
}) {
  const { handleSubmit, isLoading } = useUpdateMutation(
    environment,
    onSuccessUpdate
  );

  const initialValues: FormValues = {
    name: environment.Name,
    url: environment.URL,
    publicUrl: environment.PublicURL || '',

    meta: {
      tagIds: environment.TagIds,
      groupId: environment.GroupId,
    },
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField />
            <AgentAddressField />
            <PublicIPField />
          </FormSection>

          <MetadataFieldset />
          <EnvironmentFormActions isLoading={isLoading} isValid={isValid} />
        </Form>
      )}
    </Formik>
  );
}
