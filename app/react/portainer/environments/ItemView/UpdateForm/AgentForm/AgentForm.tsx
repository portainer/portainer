import { Form, Formik } from 'formik';

import { FormSection } from '@@/form-components/FormSection';

import { Environment, EnvironmentType } from '../../../types';
import { MetadataFieldset } from '../../../common/MetadataFieldset';
import { NameField } from '../../../common/NameField';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '../../../queries/useUpdateEnvironmentMutation';
import { EnvironmentFormActions } from '../EnvironmentFormActions';
import { PublicIPField } from '../PublicIPField';

import { AgentAddressField } from './AgentEnvironmentAddress';

interface FormValues {
  name: string;

  url: string;
  publicUrl: string;

  meta: {
    tagIds: number[];
    groupId: number;
  };
}

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

export function useUpdateMutation(
  environment: Environment,
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
      PublicURL: values.publicUrl,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
    };

    if (environment.Type === EnvironmentType.AgentOnDocker) {
      payload.URL = `tcp://${values.url}`;
    }

    if (environment.Type === EnvironmentType.AgentOnKubernetes) {
      payload.URL = values.url;
    }

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
