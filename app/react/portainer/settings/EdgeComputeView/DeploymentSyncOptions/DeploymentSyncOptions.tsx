import { Form, Formik } from 'formik';
import { useReducer } from 'react';
import { Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { notifySuccess } from '@/portainer/services/notifications';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';

import { useSettings, useUpdateSettingsMutation } from '../../queries';

import { FormValues } from './types';

export function DeploymentSyncOptions() {
  const { t } = useTranslation();
  const settingsQuery = useSettings();
  const settingsMutation = useUpdateSettingsMutation();
  const [formKey, resetForm] = useReducer((state) => state + 1, 0);

  const asyncIntervalFieldSettings = {
    ping: {
      label: t('settings.edge_ping_label'),
      tooltip: t('settings.edge_ping_tooltip'),
    },
    snapshot: {
      label: t('settings.edge_snapshot_label'),
      tooltip: t('settings.edge_snapshot_tooltip'),
    },
    command: {
      label: t('settings.edge_command_label'),
      tooltip: t('settings.edge_command_tooltip'),
    },
  };

  if (!settingsQuery.data) {
    return null;
  }

  const initialValues: FormValues = {
    Edge: {
      CommandInterval: settingsQuery.data.Edge.CommandInterval,
      PingInterval: settingsQuery.data.Edge.PingInterval,
      SnapshotInterval: settingsQuery.data.Edge.SnapshotInterval,
    },
    EdgeAgentCheckinInterval: settingsQuery.data.EdgeAgentCheckinInterval,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon={Laptop} title={t('settings.deployment_sync_title')} />
        <WidgetBody>
          <Formik<FormValues>
            initialValues={initialValues}
            onSubmit={handleSubmit}
            key={formKey}
          >
            {({ setFieldValue, values, isValid, dirty }) => (
              <Form className="form-horizontal">
                <TextTip color="blue">
                  {t('settings.deployment_sync_tip')}
                </TextTip>

                <FormSection title={t('settings.check_in_intervals_section')}>
                  <EdgeCheckinIntervalField
                    value={values.EdgeAgentCheckinInterval}
                    onChange={(value) =>
                      setFieldValue('EdgeAgentCheckinInterval', value)
                    }
                    isDefaultHidden
                    label={t('settings.edge_poll_label')}
                    tooltip={t('settings.edge_poll_tooltip')}
                  />
                </FormSection>

                {isBE && (
                  <FormSection title={t('settings.async_check_in_section')}>
                    <EdgeAsyncIntervalsForm
                      values={values.Edge}
                      onChange={(value) => setFieldValue('Edge', value)}
                      isDefaultHidden
                      fieldSettings={asyncIntervalFieldSettings}
                    />
                  </FormSection>
                )}

                <div className="form-group mt-5">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      className="!ml-0"
                      data-cy="settings-deploySyncOptionsButton"
                      isLoading={settingsMutation.isLoading}
                      loadingText={t('settings.saving_settings')}
                    >
                      {t('settings.save_settings')}
                    </LoadingButton>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </WidgetBody>
      </Widget>
    </div>
  );

  function handleSubmit(values: FormValues) {
    settingsMutation.mutate(
      {
        Edge: values.Edge,
        EdgeAgentCheckinInterval: values.EdgeAgentCheckinInterval,
      },
      {
        onSuccess() {
          notifySuccess(t('common.success'), t('settings.deployment_sync_success'));
          resetForm();
        },
      }
    );
  }
}
