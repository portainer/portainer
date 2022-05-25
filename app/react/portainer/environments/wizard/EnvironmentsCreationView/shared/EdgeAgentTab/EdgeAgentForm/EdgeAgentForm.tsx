import { Formik, Form } from 'formik';

import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { Environment } from '@/portainer/environments/types';
import { useCreateEdgeAgentEnvironmentMutation } from '@/portainer/environments/queries/useCreateEnvironmentMutation';
import { baseHref } from '@/portainer/helpers/pathHelper';
import { FormSection } from '@/portainer/components/form-components/FormSection';
import { EdgeCheckinIntervalField } from '@/edge/components/EdgeCheckInIntervalField';

import { MetadataFieldset } from '../../MetadataFieldset';

import { EdgeAgentFieldset } from './EdgeAgentFieldset';
import { validationSchema } from './EdgeAgentForm.validation';
import { FormValues } from './types';

interface Props {
  onCreate(environment: Environment): void;
  readonly: boolean;
}

const initialValues = buildInitialValues();

export function EdgeAgentForm({ onCreate, readonly }: Props) {
  const createMutation = useCreateEdgeAgentEnvironmentMutation();

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validateOnMount
      validationSchema={validationSchema}
    >
      {({ isValid, setFieldValue, values }) => (
        <Form>
          <EdgeAgentFieldset readonly={readonly} />

          <FormSection isFoldable title="More Settings">
            <FormSection title="Check-in Intervals">
              <EdgeCheckinIntervalField
                readonly={readonly}
                onChange={(value) => setFieldValue('pollFrequency', value)}
                value={values.pollFrequency}
              />
            </FormSection>

            <MetadataFieldset isFoldable={false} />
          </FormSection>

          {!readonly && (
            <div className="row">
              <div className="col-sm-12">
                <LoadingButton
                  isLoading={createMutation.isLoading}
                  loadingText="Creating environment..."
                  disabled={!isValid}
                >
                  <i className="fa fa-plug space-right" />
                  Create
                </LoadingButton>
              </div>
            </div>
          )}
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: typeof initialValues) {
    createMutation.mutate(values, {
      onSuccess(environment) {
        onCreate(environment);
      },
    });
  }
}

export function buildInitialValues(): FormValues {
  return {
    name: '',
    portainerUrl: defaultPortainerUrl(),
    pollFrequency: 0,
    meta: {
      groupId: 1,
      tagIds: [],
    },
  };

  function defaultPortainerUrl() {
    const baseHREF = baseHref();
    return window.location.origin + (baseHREF !== '/' ? baseHREF : '');
  }
}
