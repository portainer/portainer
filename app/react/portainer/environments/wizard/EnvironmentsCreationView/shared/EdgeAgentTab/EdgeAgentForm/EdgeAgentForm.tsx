import { Formik, Form } from 'formik';
import { Plug2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  ContainerEngine,
  Environment,
} from '@/react/portainer/environments/types';
import { useCreateEdgeAgentEnvironmentMutation } from '@/react/portainer/environments/queries/useCreateEnvironmentMutation';
import { Settings } from '@/react/portainer/settings/types';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import {
  EdgeAsyncIntervalsForm,
  EDGE_ASYNC_INTERVAL_USE_DEFAULT,
} from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { useSettings } from '@/react/portainer/settings/queries';
import { buildDefaultValue as buildTunnelDefaultValue } from '@/react/portainer/common/PortainerTunnelAddrField';
import { buildDefaultValue as buildApiUrlDefaultValue } from '@/react/portainer/common/PortainerUrlField';

import { FormSection } from '@@/form-components/FormSection';
import { LoadingButton } from '@@/buttons/LoadingButton';

import { MoreSettingsSection } from '../../MoreSettingsSection';

import { EdgeAgentFieldset } from './EdgeAgentFieldset';
import { useValidationSchema } from './EdgeAgentForm.validation';
import { FormValues } from './types';

interface Props {
  onCreate(environment: Environment): void;
  readonly: boolean;
  asyncMode: boolean;
  containerEngine: ContainerEngine;
}

export function EdgeAgentForm({
  onCreate,
  readonly,
  asyncMode,
  containerEngine,
}: Props) {
  const { t } = useTranslation();
  const settingsQuery = useSettings();

  const createMutation = useCreateEdgeAgentEnvironmentMutation();
  const validation = useValidationSchema();

  if (!settingsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;

  const initialValues = buildInitialValues(settings);

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validateOnMount
      validationSchema={validation}
    >
      {({ isValid, setFieldValue, values }) => (
        <Form>
          <EdgeAgentFieldset readonly={readonly} asyncMode={asyncMode} />

          <MoreSettingsSection>
            <FormSection title={t('wizard_env.check_in_intervals')}>
              {asyncMode ? (
                <EdgeAsyncIntervalsForm
                  values={values.edge}
                  readonly={readonly}
                  onChange={(values) => setFieldValue('edge', values)}
                />
              ) : (
                <EdgeCheckinIntervalField
                  readonly={readonly}
                  onChange={(value) => setFieldValue('pollFrequency', value)}
                  value={values.pollFrequency}
                />
              )}
            </FormSection>
          </MoreSettingsSection>

          {!readonly && (
            <div className="row">
              <div className="col-sm-12">
                <LoadingButton
                  className="vertical-center"
                  data-cy="edge-agent-form-submit-button"
                  isLoading={createMutation.isLoading}
                  loadingText={t('wizard_env.creating')}
                  disabled={!isValid}
                  icon={Plug2}
                >
                  {t('wizard_env.create')}
                </LoadingButton>
              </div>
            </div>
          )}
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: typeof initialValues) {
    createMutation.mutate(
      {
        ...values,
        edge: {
          ...values.edge,
          asyncMode,
        },
        containerEngine,
      },
      {
        onSuccess(environment) {
          onCreate(environment);
        },
      }
    );
  }
}

export function buildInitialValues(settings: Settings): FormValues {
  return {
    name: '',
    portainerUrl: settings.EdgePortainerUrl || buildApiUrlDefaultValue(),
    tunnelServerAddr:
      settings.Edge.TunnelServerAddress || buildTunnelDefaultValue(),
    pollFrequency: 0,
    meta: {
      groupId: 1,
      tagIds: [],
    },
    edge: {
      CommandInterval: EDGE_ASYNC_INTERVAL_USE_DEFAULT,
      PingInterval: EDGE_ASYNC_INTERVAL_USE_DEFAULT,
      SnapshotInterval: EDGE_ASYNC_INTERVAL_USE_DEFAULT,
    },
  };
}
