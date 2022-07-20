import { Form, Formik } from 'formik';
import { useReducer } from 'react';

import { useCreateAgentEnvironmentMutation } from '@/portainer/environments/queries/useCreateEnvironmentMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import { Environment } from '@/portainer/environments/types';
import { CreateAgentEnvironmentValues } from '@/portainer/environments/environment.service/create';

import { LoadingButton } from '@@/buttons/LoadingButton';

import { NameField } from '../NameField';
import { MoreSettingsSection } from '../MoreSettingsSection';
import { Hardware } from '../Hardware/Hardware';

import { EnvironmentUrlField } from './EnvironmentUrlField';
import { validation } from './AgentForm.validation';

interface Props {
  onCreate(environment: Environment): void;
  showGpus?: boolean;
}

const initialValues: CreateAgentEnvironmentValues = {
  environmentUrl: '',
  name: '',
  meta: {
    groupId: 1,
    tagIds: [],
  },
  gpus: [],
};

export function AgentForm({ onCreate, showGpus = false }: Props) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  const mutation = useCreateAgentEnvironmentMutation();

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
          <EnvironmentUrlField />

          <MoreSettingsSection>{showGpus && <Hardware />}</MoreSettingsSection>

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

  function handleSubmit(values: CreateAgentEnvironmentValues) {
    mutation.mutate(values, {
      onSuccess(environment) {
        notifySuccess('Environment created', environment.Name);
        clearForm();
        onCreate(environment);
      },
    });
  }
}
